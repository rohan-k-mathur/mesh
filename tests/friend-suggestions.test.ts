import { updateUserEmbedding, generateFriendSuggestions } from "@/lib/actions/friend-suggestions.actions";
import { deepseekEmbedding } from "@/lib/deepseekclient";

var mockPrisma: any;

jest.mock("@/lib/deepseekclient", () => ({
  deepseekEmbedding: jest.fn(async () => [1, 2, 3]),
}));

jest.mock("@/lib/prismaclient", () => {
  mockPrisma = {
    $connect: jest.fn(),
    userAttributes: { findUnique: jest.fn() },
    userEmbedding: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    friendSuggestion: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateUserEmbedding", () => {
  it("writes embedding to database", async () => {
    mockPrisma.userAttributes.findUnique.mockResolvedValue({
      interests: ["coding"],
      hobbies: [],
      artists: [],
      albums: [],
      movies: [],
      books: [],
      communities: [],
    });

    const id = BigInt(1);
    await updateUserEmbedding(id);

    expect(mockPrisma.userEmbedding.upsert).toHaveBeenCalledWith({
      where: { user_id: id },
      update: { embedding: [1, 2, 3] },
      create: { user_id: id, embedding: [1, 2, 3] },
    });
  });
});

describe("generateFriendSuggestions", () => {
  it("ranks users by similarity", async () => {
    mockPrisma.userEmbedding.findUnique.mockResolvedValue({
      user_id: BigInt(1),
      embedding: [1, 0, 0],
    });
    mockPrisma.userEmbedding.findMany.mockResolvedValue([
      { user_id: BigInt(2), embedding: [1, 0, 0] },
      { user_id: BigInt(3), embedding: [0, 1, 0] },
    ]);
    (Math.random as any) = () => 0.4;

    const result = await generateFriendSuggestions(BigInt(1));

    expect(result.map((r) => r.id)).toEqual([BigInt(2), BigInt(3)]);
    expect(mockPrisma.friendSuggestion.create).toHaveBeenNthCalledWith(1, {
      data: { user_id: BigInt(1), suggested_user_id: BigInt(2), score: 1 },
    });
    expect(mockPrisma.friendSuggestion.create).toHaveBeenNthCalledWith(2, {
      data: { user_id: BigInt(1), suggested_user_id: BigInt(3), score: 0 },
    });
  });
});
