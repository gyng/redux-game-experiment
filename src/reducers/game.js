let totallyUniqueIdCounter = 0;

const makeEntity = (position) => ({
  uid: totallyUniqueIdCounter++,
  radius: 10,
  position
});

export default function game(state = {}, action) {
  let newState;

  switch (action.type) {
    case 'ADD_ENTITY':
      newState = Object.assign({}, state);
      newState.entities.push(makeEntity(action.position));
      return newState;
    case 'MOVE_ENTITY':
      newState = Object.assign({}, state);
      newState.entities[action.entityId].move(action.deltas);
      return newState;
    default:
      return state;
  }
}
