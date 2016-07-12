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
    },
    outOfBounds: function(minX, maxX, minY, maxY) {
      return this.position.x < minX || this.position.x > maxX ||
             this.position.y < minY || this.position.y > maxY
    }
  }, options);
}

let deg2rad = (deg) => deg * 180 / Math.PI;

export default function game(state = { entities: [], keys: {} }, action) {
  let newState, entity;

  switch (action.type) {
    case 'ADD_ENTITY':
      return update(state, {
        entities: {
          $push: [makeEntity(action.options)]
        }
      })
      // Don't use Object.assign, it only shallow updates
      // newState = Object.assign({}, state);
      // newState.entities.push(makeEntity(action.options));
      // return newState;
    case 'KILL_ENTITY':
      return update(state, {
        entities: {
          [action.entityId]: { $set: null }
        }
      })
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
    case 'SET_ENTITY_POSITION':
      entity = state.entities[action.entityId];
      return update(state, {
        entities: {
          [action.entityId]: {
            position: {
              x: { $set: action.position.x },
              y: { $set: action.position.y }
            }
          }
        }
      })
    case 'FLIP_ENTITY_DIRECTION':
      entity = state.entities[action.entityId];

      let newDirection;
      const delta = action.delta || entity.direction;

      const direction = entity.direction;
      if (entity.direction > Math.PI && entity.direction < Math.PI * 2) {
        newDirection = (entity.direction + delta) / 2 + (Math.PI * 3/ 2);
      } else {
        newDirection = (entity.direction + delta) / 2 - (Math.PI / 2);
      }

      // newDirection = newDirection % (2 * Math.PI)

      return update(state, {
        entities: {
          [action.entityId]: {
            direction: { $set: newDirection },
            position: {
              x: { $set: entity.position.x + Math.cos(newDirection) * 16 },
              y: { $set: entity.position.y + Math.sin(newDirection) * 16 }
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
