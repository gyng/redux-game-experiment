var update = require('react/lib/update');

let totallyUniqueIdCounter = 0;

const makeEntity = (options) => {
  totallyUniqueIdCounter++;
  return Object.assign({
    uid: totallyUniqueIdCounter - 1,
    width: 20,
    height: 20,
    tick: null,
    intersectsWith: function(other) {
      return !( this.position.x +  this.width  < other.position.x ||
               other.position.x + other.width  <  this.position.x ||
                this.position.y +  this.height < other.position.y ||
               other.position.y + other.height <  this.position.y)
    }
    }, options);
}

export default function game(state = { entities: [], keys: {} }, action) {
  let newState, entity;

  switch (action.type) {
    case 'ADD_ENTITY':
      newState = Object.assign({}, state);
      newState.entities.push(makeEntity(action.options));
      return newState;
    case 'MOVE_ENTITY':
      entity = state.entities[action.entityId];
      return update(state, {
        entities: {
          [action.entityId]: {
            position: {
              x: { $set: entity.position.x + action.delta.x },
              y: { $set: entity.position.y + action.delta.y }
            }
          }
        }
      })
    case 'FLIP_ENTITY_DIRECTION':
      entity = state.entities[action.entityId];
      const newDirection = 1.5 * Math.PI + (-1.5 * Math.PI - entity.direction);

      return update(state, {
        entities: {
          [action.entityId]: {
            direction: { $set: newDirection },
            position: {
              x: { $set: entity.position.x + Math.cos(newDirection) * entity.speed * 2 },
              y: { $set: entity.position.y + Math.sin(newDirection) * entity.speed * 2 }
            }
          }
        }
      })
    case 'KEY_DOWN':
      newState = Object.assign({}, state);
      newState.keys[action.key] = true;
      return newState;
    case 'KEY_UP':
      newState = Object.assign({}, state);
      newState.keys[action.key] = false;
      return newState;
    default:
      return state;
  }
}
