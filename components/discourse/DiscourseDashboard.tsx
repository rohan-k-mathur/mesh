// components/discourse/DiscourseDashboard.tsx
"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { 
  User, 
  MessageSquare, 
  Swords, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Users,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClaimDetailPanel } from "@/components/claims/ClaimDetailPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DiscourseDashboardProps {
  deliberationId: string;
  userId: string;
}

type DashboardTab = "contributions" | "engagements" | "actions-on-me" | "activity";

/**
 * DiscourseDashboard
 * 
 * Comprehensive dashboard for tracking user participation in deliberations.
 * Shows contributions, engagements, and actions taken on user's work.
 * 
 * Two-tier tab structure:
 * - Top level: My Contributions, My Engagements, Actions on My Work, Activity Feed
 * - Sub-tabs within each category for granular filtering
 */
export function DiscourseDashboard({ deliberationId, userId }: DiscourseDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("contributions");

  return (
    <div className="discourse-dashboard space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Discourse Dashboard</h2>
        <p className="text-sm text-slate-500">Track your participation and engagements</p>
      </div>

      {/* Top-Level Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === "contributions"}
            onClick={() => setActiveTab("contributions")}
            icon={FileText}
            label="My Contributions"
          />
          <TabButton
            active={activeTab === "engagements"}
            onClick={() => setActiveTab("engagements")}
            icon={MessageSquare}
            label="My Engagements"
          />
          <TabButton
            active={activeTab === "actions-on-me"}
            onClick={() => setActiveTab("actions-on-me")}
            icon={Target}
            label="Actions on My Work"
            
          />
          <TabButton
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
            icon={TrendingUp}
            label="Activity Feed"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "contributions" && (
          <MyContributionsPanel deliberationId={deliberationId} userId={userId} />
        )}
        {activeTab === "engagements" && (
          <MyEngagementsPanel deliberationId={deliberationId} userId={userId} />
        )}
        {activeTab === "actions-on-me" && (
          <ActionsOnMyWorkPanel deliberationId={deliberationId} userId={userId} />
        )}
        {activeTab === "activity" && (
          <ActivityFeedPanel deliberationId={deliberationId} userId={userId} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

function TabButton({ active, onClick, icon: Icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
        ${active 
          ? "border-indigo-600 text-indigo-600" 
          : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Panel 1: My Contributions
// ============================================================================

type ContributionSubTab = "all" | "claims" | "arguments" | "propositions";

function MyContributionsPanel({ deliberationId, userId }: { deliberationId: string; userId: string }) {
  const [subTab, setSubTab] = React.useState<ContributionSubTab>("all");

  // Fetch user's contributions
  const { data: claims, isLoading: loadingClaims } = useSWR(
    `/api/deliberations/${deliberationId}/claims?authorId=${userId}`,
    fetcher
  );

  const { data: args, isLoading: loadingArgs } = useSWR(
    `/api/deliberations/${deliberationId}/arguments?authorId=${userId}`,
    fetcher
  );

  const totalClaims = claims?.items?.length || 0;
  const totalArguments = args?.items?.length || 0;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <SubTabButton
          active={subTab === "all"}
          onClick={() => setSubTab("all")}
          label="All"
          count={totalClaims + totalArguments}
        />
        <SubTabButton
          active={subTab === "claims"}
          onClick={() => setSubTab("claims")}
          label="Claims"
          count={totalClaims}
        />
        <SubTabButton
          active={subTab === "arguments"}
          onClick={() => setSubTab("arguments")}
          label="Arguments"
          count={totalArguments}
        />
        <SubTabButton
          active={subTab === "propositions"}
          onClick={() => setSubTab("propositions")}
          label="Propositions"
          count={0}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Claims Created"
          value={totalClaims}
          color="sky"
        />
        <StatCard
          icon={MessageSquare}
          label="Arguments Created"
          value={totalArguments}
          color="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Propositions"
          value={0}
          color="green"
        />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {(loadingClaims || loadingArgs) ? (
          <div className="text-center py-8 text-slate-500">Loading contributions...</div>
        ) : (
          <>
            {(subTab === "all" || subTab === "claims") && claims?.items?.map((claim: any) => (
              <ContributionCard
                key={claim.id}
                type="claim"
                id={claim.id}
                text={claim.text}
                createdAt={claim.createdAt}
                deliberationId={deliberationId}
              />
            ))}
            
            {(subTab === "all" || subTab === "arguments") && args?.items?.map((arg: any) => (
              <ContributionCard
                key={arg.id}
                type="argument"
                id={arg.id}
                text={arg.text || arg.claim?.text || "Untitled Argument"}
                createdAt={arg.createdAt}
                deliberationId={deliberationId}
              />
            ))}
            
            {totalClaims === 0 && totalArguments === 0 && (
              <EmptyState
                icon={FileText}
                title="No contributions yet"
                description="Create your first claim or argument to get started."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Panel 2: My Engagements
// ============================================================================

type EngagementSubTab = "all" | "attacks" | "challenges" | "responses" | "votes";

function MyEngagementsPanel({ deliberationId, userId }: { deliberationId: string; userId: string }) {
  const [subTab, setSubTab] = React.useState<EngagementSubTab>("all");

  // Fetch user's attacks
  const { data: attacks } = useSWR(
    `/api/deliberations/${deliberationId}/attacks?attackerId=${userId}`,
    fetcher
  );

  // Fetch user's dialogue moves
  const { data: dialogueMoves } = useSWR(
    `/api/deliberations/${deliberationId}/dialogue-moves?actorId=${userId}`,
    fetcher
  );

  // Ensure attacks is an array
  const attacksArray = Array.isArray(attacks) ? attacks : [];
  const totalAttacks = attacksArray.length;
  const whyMoves = dialogueMoves?.filter((m: any) => m.kind === "WHY") || [];
  const groundsMoves = dialogueMoves?.filter((m: any) => m.kind === "GROUNDS") || [];
  const totalChallenges = whyMoves.length;
  const totalResponses = groundsMoves.length;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <SubTabButton
          active={subTab === "all"}
          onClick={() => setSubTab("all")}
          label="All"
          count={totalAttacks + totalChallenges + totalResponses}
        />
        <SubTabButton
          active={subTab === "attacks"}
          onClick={() => setSubTab("attacks")}
          label="Attacks"
          count={totalAttacks}
        />
        <SubTabButton
          active={subTab === "challenges"}
          onClick={() => setSubTab("challenges")}
          label="Challenges (WHY)"
          count={totalChallenges}
        />
        <SubTabButton
          active={subTab === "responses"}
          onClick={() => setSubTab("responses")}
          label="Responses (GROUNDS)"
          count={totalResponses}
        />
        <SubTabButton
          active={subTab === "votes"}
          onClick={() => setSubTab("votes")}
          label="Votes"
          count={0}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Swords}
          label="Attacks Created"
          value={totalAttacks}
          color="red"
        />
        <StatCard
          icon={AlertCircle}
          label="Challenges (WHY)"
          value={totalChallenges}
          color="amber"
        />
        <StatCard
          icon={MessageSquare}
          label="Responses (GROUNDS)"
          value={totalResponses}
          color="sky"
        />
        <StatCard
          icon={ThumbsUp}
          label="Votes Cast"
          value={0}
          color="green"
        />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {(subTab === "all" || subTab === "attacks") && attacksArray.map((attack: any) => (
          <EngagementCard
            key={attack.id}
            type="attack"
            data={attack}
            deliberationId={deliberationId}
          />
        ))}

        {(subTab === "all" || subTab === "challenges") && whyMoves.map((move: any) => (
          <EngagementCard
            key={move.id}
            type="challenge"
            data={move}
            deliberationId={deliberationId}
          />
        ))}

        {(subTab === "all" || subTab === "responses") && groundsMoves.map((move: any) => (
          <EngagementCard
            key={move.id}
            type="response"
            data={move}
            deliberationId={deliberationId}
          />
        ))}

        {totalAttacks === 0 && totalChallenges === 0 && totalResponses === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No engagements yet"
            description="Engage with others by creating attacks, challenges, or responses."
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Panel 3: Actions on My Work (CRITICAL FOR NOTIFICATION WORKFLOW)
// ============================================================================

type ActionSubTab = "all" | "attacks" | "challenges" | "responses" | "pending";

function ActionsOnMyWorkPanel({ deliberationId, userId }: { deliberationId: string; userId: string }) {
  const [subTab, setSubTab] = React.useState<ActionSubTab>("pending");

  // Fetch attacks on user's work
  const { data: attacksOnMe } = useSWR(
    `/api/deliberations/${deliberationId}/attacks-on-user?userId=${userId}`,
    fetcher
  );

  // Fetch challenges on user's work
  const { data: challengesOnMe } = useSWR(
    `/api/deliberations/${deliberationId}/challenges-on-user?userId=${userId}`,
    fetcher
  );

  const totalAttacks = attacksOnMe?.length || 0;
  const totalChallenges = challengesOnMe?.length || 0;
  const pendingActions = (attacksOnMe?.filter((a: any) => !a.responded) || []).concat(
    challengesOnMe?.filter((c: any) => !c.responded) || []
  );

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <SubTabButton
          active={subTab === "pending"}
          onClick={() => setSubTab("pending")}
          label="Pending Response"
          count={pendingActions.length}
          highlight
        />
        <SubTabButton
          active={subTab === "all"}
          onClick={() => setSubTab("all")}
          label="All"
          count={totalAttacks + totalChallenges}
        />
        <SubTabButton
          active={subTab === "attacks"}
          onClick={() => setSubTab("attacks")}
          label="Attacks"
          count={totalAttacks}
        />
        <SubTabButton
          active={subTab === "challenges"}
          onClick={() => setSubTab("challenges")}
          label="Challenges"
          count={totalChallenges}
        />
        <SubTabButton
          active={subTab === "responses"}
          onClick={() => setSubTab("responses")}
          label="Responses Received"
          count={0}
        />
      </div>

      {/* Alert Banner */}
      {pendingActions.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              {pendingActions.length} {pendingActions.length === 1 ? "action requires" : "actions require"} your response
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Your arguments or claims have been challenged/attacked. Review and respond below.
            </p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Pending Response"
          value={pendingActions.length}
          color="amber"
        />
        <StatCard
          icon={Swords}
          label="Attacks Received"
          value={totalAttacks}
          color="red"
        />
        <StatCard
          icon={AlertCircle}
          label="Challenges Received"
          value={totalChallenges}
          color="orange"
        />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {(subTab === "pending" || subTab === "all" || subTab === "attacks") && 
          attacksOnMe?.map((attack: any) => (
            <ActionOnMeCard
              key={attack.id}
              type="attack"
              data={attack}
              deliberationId={deliberationId}
              userId={userId}
            />
          ))
        }

        {(subTab === "pending" || subTab === "all" || subTab === "challenges") && 
          challengesOnMe?.map((challenge: any) => (
            <ActionOnMeCard
              key={challenge.id}
              type="challenge"
              data={challenge}
              deliberationId={deliberationId}
              userId={userId}
            />
          ))
        }

        {totalAttacks === 0 && totalChallenges === 0 && (
          <EmptyState
            icon={CheckCircle2}
            title="No actions on your work"
            description="Your contributions haven't been challenged or attacked yet."
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Panel 4: Activity Feed
// ============================================================================

function ActivityFeedPanel({ deliberationId, userId }: { deliberationId: string; userId: string }) {
  const { data: activities, isLoading } = useSWR(
    `/api/deliberations/${deliberationId}/activity-feed?userId=${userId}`,
    fetcher
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
        <button className="text-xs text-indigo-600 hover:text-indigo-700">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading activity...</div>
        ) : activities?.length > 0 ? (
          activities.map((activity: any) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No recent activity"
            description="Activity will appear here as you and others engage in the deliberation."
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

interface SubTabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  highlight?: boolean;
}

function SubTabButton({ active, onClick, label, count, highlight }: SubTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md transition-colors
        ${active 
          ? highlight
            ? "bg-amber-100 text-amber-800"
            : "bg-indigo-100 text-indigo-700"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-xs opacity-75">({count})</span>
      )}
    </button>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "sky" | "indigo" | "green" | "red" | "amber" | "orange";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

interface ContributionCardProps {
  type: "claim" | "argument" | "proposition";
  id: string;
  text: string;
  createdAt: string;
  deliberationId: string;
}

function ContributionCard({ type, id, text, createdAt }: ContributionCardProps) {
  const typeConfig = {
    claim: { icon: FileText, color: "text-sky-600", bg: "bg-sky-50", label: "Claim" },
    argument: { icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", label: "Argument" },
    proposition: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Proposition" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            <span className="text-xs text-slate-500">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-700 line-clamp-2">{text}</p>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1">
          View <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface EngagementCardProps {
  type: "attack" | "challenge" | "response" | "vote";
  data: any;
  deliberationId: string;
}

function EngagementCard({ type, data }: EngagementCardProps) {
  const typeConfig = {
    attack: { icon: Swords, color: "text-red-600", bg: "bg-red-50", label: "Attack" },
    challenge: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", label: "Challenge (WHY)" },
    response: { icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50", label: "Response (GROUNDS)" },
    vote: { icon: ThumbsUp, color: "text-green-600", bg: "bg-green-50", label: "Vote" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            <span className="text-xs text-slate-500">
              {new Date(data.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-700">
            {type === "attack" && `${data.legacyAttackType} attack on ${data.targetType}: "${data.targetText || "Unknown"}"`}
            {type === "challenge" && `Challenged: "${data.targetText || "Unknown"}"`}
            {type === "response" && `Responded with GROUNDS: "${data.groundsText || data.payload?.text || "..."}"`}
          </p>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1">
          View <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface ActionOnMeCardProps {
  type: "attack" | "challenge";
  data: any;
  deliberationId: string;
  userId: string;
}

function ActionOnMeCard({ type, data, deliberationId, userId }: ActionOnMeCardProps) {
  const [responding, setResponding] = React.useState(false);
  const [responseType, setResponseType] = React.useState<"GROUNDS" | "RETRACT">("GROUNDS");
  const [groundsText, setGroundsText] = React.useState("");
  const [showGroundsInput, setShowGroundsInput] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);

  const handleRespond = async () => {
    // Validate GROUNDS text if GROUNDS is selected
    if (responseType === "GROUNDS" && !groundsText.trim()) {
      alert("Please provide grounds for your response");
      return;
    }

    setResponding(true);
    try {
      if (responseType === "GROUNDS") {
        // Use answer-and-commit API for GROUNDS with text
        await fetch("/api/dialogue/answer-and-commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            targetType: data.targetType,
            targetId: data.targetId,
            cqKey: "default",
            locusPath: "0",
            expression: groundsText,
            original: groundsText,
            commitOwner: "Proponent",
            commitPolarity: "pos",
          }),
        });
      } else if (responseType === "CONCEDE") {
        // Create CONCEDE dialogue move (accepts the challenge/attack)
        await fetch("/api/dialogue/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            targetType: data.targetType,
            targetId: data.targetId,
            kind: "ASSERT", // CONCEDE is represented as ASSERT with as:"CONCEDE" marker
            actorId: userId,
            payload: { 
              locusPath: "0",
              as: "CONCEDE", // Mark this ASSERT as a CONCEDE
              expression: "I accept this challenge",
            },
          }),
        });
      } else {
        // Create simple dialogue move for RETRACT
        await fetch("/api/dialogue/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            targetType: data.targetType,
            targetId: data.targetId,
            kind: responseType,
            actorId: userId,
            payload: { locusPath: "0" },
          }),
        });
      }
      
      // Refresh data using SWR mutate
      mutate((key) => typeof key === 'string' && key.includes(`/api/deliberations/${deliberationId}`));
      
      // Reset state
      setShowGroundsInput(false);
      setGroundsText("");
    } catch (err) {
      console.error("Failed to respond:", err);
      alert("Failed to submit response. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  const typeConfig = {
    attack: { icon: Swords, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    challenge: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`p-4 border-2 rounded-lg ${config.border} ${config.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm font-semibold ${config.color}`}>
              {type === "attack" ? "Attack Received" : "Challenge Received"}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(data.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-3">
            {type === "attack" && (
              <>
                <strong>{data.attackerName || "Someone"}</strong> created a{" "}
                <span className="font-semibold">{data.legacyAttackType}</span> attack on your{" "}
                {data.targetType}
              </>
            )}
            {type === "challenge" && (
              <>
                <strong>{data.challengerName || "Someone"}</strong> asked <strong>WHY</strong>:{" "}
                "{data.payload?.text || "Why do you assert this?"}"
              </>
            )}
          </p>

          {/* Response Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={responseType}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  setResponseType(newType);
                  setShowGroundsInput(newType === "GROUNDS");
                }}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              >
                <option value="GROUNDS">Provide GROUNDS (Defend)</option>
                <option value="CONCEDE">CONCEDE (Accept)</option>
                <option value="RETRACT">RETRACT (Withdraw)</option>
              </select>
              {!showGroundsInput && (
                <button
                  onClick={() => {
                    if (responseType === "GROUNDS") {
                      setShowGroundsInput(true);
                    } else {
                      handleRespond();
                    }
                  }}
                  disabled={responding}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {responding ? "Responding..." : "Respond"}
                </button>
              )}
              <button 
                onClick={() => setShowDetailsModal(true)}
                className="text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded"
              >
                View Details
              </button>
            </div>

            {/* GROUNDS text input */}
            {showGroundsInput && responseType === "GROUNDS" && (
              <div className="space-y-2 mt-2">
                <textarea
                  value={groundsText}
                  onChange={(e) => setGroundsText(e.target.value)}
                  placeholder="Provide your grounds/justification..."
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRespond}
                    disabled={responding || !groundsText.trim()}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {responding ? "Submitting..." : "Submit GROUNDS"}
                  </button>
                  <button
                    onClick={() => {
                      setShowGroundsInput(false);
                      setGroundsText("");
                    }}
                    className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {type === "attack" ? "Attack Details" : "Challenge Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Target Information */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Target {data.targetType === "claim" ? "Claim" : "Argument"}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                {data.targetText || "No text available"}
              </p>
              
              {/* Show ClaimDetailPanel if target is a claim */}
              {data.targetType === "claim" && data.targetId && (
                <ClaimDetailPanel
                  claimId={data.targetId}
                  deliberationId={deliberationId}
                  claimText={data.targetText}
                  claimAuthorId={data.targetAuthorId}
                  createdById={data.targetAuthorId}
                  currentUserId={data.currentUserId}
                  className="mt-3"
                />
              )}
            </div>

            {/* Attack/Challenge Information */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                {type === "attack" ? "Attack Information" : "Challenge Information"}
              </h3>
              {type === "attack" && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Type:</span>{" "}
                    <span className="text-slate-700">{data.legacyAttackType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Attacker:</span>{" "}
                    <span className="text-slate-700">{data.attackerName || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Created:</span>{" "}
                    <span className="text-slate-700">
                      {new Date(data.createdAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {type === "challenge" && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Question:</span>{" "}
                    <span className="text-slate-700">
                      {data.payload?.text || "Why do you assert this?"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Challenger:</span>{" "}
                    <span className="text-slate-700">{data.challengerName || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Created:</span>{" "}
                    <span className="text-slate-700">
                      {new Date(data.createdAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityCard({ activity }: { activity: any }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg">
        <Users className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{activity.description}</p>
        <span className="text-xs text-slate-500">
          {new Date(activity.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
