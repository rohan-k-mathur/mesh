import { produce } from 'immer';           // keeps code readable
import { GameState, RingState } from '@/types/pivot';

export type Action =
  | { type: 'INIT_GAME'; payload: InitPayload }
  | { type: 'ROTATE'; ringIndex: 0|1|2|3; dir: 1|-1 }
  | { type: 'GIVE_UP' }
  | { type: 'PEEK_HINT'; column: number };

export function pivotReducer(state: GameState, action: Action): GameState {
  return produce(state, draft => {
    switch (action.type) {
      case 'INIT_GAME':
        return action.payload.initialState;

      case 'ROTATE':
        handleRotate(draft, action.ringIndex, action.dir);
        return;

      case 'PEEK_HINT':
        revealLetter(draft, action.column);
        return;

      /* …more… */
    }
  });
}
