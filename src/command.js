// @flow
import type { Entity } from 'entity';
import ComponentManager from 'component-manager';
import {
  Attackable,
  Attacked,
  Collidable,
  Cursor,
  Metadata,
  Player,
  PlayerControlled,
  Renderable,
  Transform,
  Turn,
} from 'component';
import MapConfig from 'config/map.json';

import { log, clamp, getEntitiesAtPosition } from 'utils';

export interface Command {
  execute(componentManager: ComponentManager): void,
}

export class NoOpCommand implements Command {
  execute() {}
}

export class ConsoleCommand implements Command {
  input: string;

  constructor(input: string) {
    this.input = input;
  }

  execute() {
    console.log(`Got input: ${this.input}`);
  }
}

export class LookCommand implements Command {
  execute(componentManager: ComponentManager) {
    const playerComponents: Map<number, Player> = componentManager.getAll({
      component: Player,
    });

    // TODO no need for a for-each, since there should only be one player
    // ...right?
    playerComponents.forEach((playerComponent: Player, myEntity) => {
      const cursorComponents = componentManager.getAll({
        component: Cursor,
      });

      if (!cursorComponents) {
        throw new Error('Could not find Cursor!');
      }

      const cursorEntity = cursorComponents.keys().next().value;
      const cursorRenderable = componentManager.get({
        entity: cursorEntity,
        component: Renderable,
      });

      if (!cursorRenderable) {
        throw new Error('Cursor must have Renderable component.');
      }

      let state = playerComponent.state;
      let nextState: ?string;
      switch (state) {
        case 'PLAYING': {
          nextState = 'LOOKING';

          const cursorTransform = componentManager.get({
            entity: cursorEntity,
            component: Transform,
          });

          if (!cursorTransform) {
            throw new Error('Cursor must have Transform component.');
          }

          const playerTransform = componentManager.get({
            entity: myEntity,
            component: Transform,
          });

          // TODO maybe bake this into componentManager as 'required' param?
          if (!playerTransform) {
            throw new Error('Player must have Transform component.');
          }

          cursorRenderable.visible = true;
          cursorTransform.x = playerTransform.x;
          cursorTransform.y = playerTransform.y;

          componentManager.add({
            entity: cursorEntity,
            components: [new PlayerControlled()],
          });
          componentManager.remove({
            entity: myEntity,
            component: PlayerControlled,
          });
          break;
        }
        case 'LOOKING': {
          nextState = 'PLAYING';
          cursorRenderable.visible = false;
          componentManager.add({
            entity: myEntity,
            components: [new PlayerControlled()],
          });
          componentManager.remove({
            entity: cursorEntity,
            component: PlayerControlled,
          });
          break;
        }
        default: {
          throw new Error(`Invalid state: ${state}`);
        }
      }
      console.log('PLAYER STATE: ' + nextState);
      playerComponent.state = nextState;
    });
  }
}

export class WaitCommand implements Command {
  execute(componentManager: ComponentManager) {
    const playerComponents = componentManager.getAll({
      component: PlayerControlled,
    });

    playerComponents.forEach((playerComponent, myEntity) => {
      let turnComponent = componentManager.get({
        entity: myEntity,
        component: Turn,
      });

      if (!turnComponent) {
        return;
      }

      if (turnComponent.myTurn) {
        log({
          componentManager: componentManager,
          message: 'Player is waiting...',
        });
        turnComponent.myTurn = false;
      }
    });
  }
}
export class MoveCommand implements Command {
  direction: string;

  constructor(direction: string) {
    this.direction = direction;
  }

  execute(componentManager: ComponentManager) {
    const playerControlledComponents = componentManager.getAll({
      component: PlayerControlled,
    });

    playerControlledComponents.forEach(
      (playerControlledComponent, myEntity) => {
        let transform = componentManager.get({
          entity: myEntity,
          component: Transform,
        });

        let turnComponent = componentManager.get({
          entity: myEntity,
          component: Turn,
        });

        if (!transform) {
          return;
        }

        if (turnComponent && !turnComponent.myTurn) {
          return;
        }

        let acted = false;

        let x_delta = 0;
        let y_delta = 0;

        // Don't use "up", "down", etc... enum? or x/y?
        switch (this.direction) {
          case 'right':
            x_delta = 1;
            break;
          case 'left':
            x_delta = -1;
            break;
          case 'up':
            y_delta = -1;
            break;
          case 'down':
            y_delta = 1;
            break;
          case 'up-left':
            x_delta = -1;
            y_delta = -1;
            break;
          case 'up-right':
            x_delta = 1;
            y_delta = -1;
            break;
          case 'down-left':
            x_delta = -1;
            y_delta = 1;
            break;
          case 'down-right':
            x_delta = 1;
            y_delta = 1;
            break;
          default:
            break;
        }

        let next_x = transform.x + x_delta;
        let next_y = transform.y + y_delta;

        next_x = clamp({
          value: next_x,
          min: 0,
          max: MapConfig.width - 1,
        });

        next_y = clamp({
          value: next_y,
          min: 0,
          max: MapConfig.height - 1,
        });

        // TODO add collision checking
        // TODO do i like camel case or snake case more?
        const entitiesOnTile = getEntitiesAtPosition({
          componentManager: componentManager,
          x: next_x,
          y: next_y,
        });

        const playerComponents = componentManager.getAll({
          component: Player,
        });

        const playerComponent = playerComponents.values().next().value;

        if (playerComponent.state === 'LOOKING' && entitiesOnTile.length > 0) {
          for (let entityOnTile of entitiesOnTile) {
            const entityOnTileMetadata = componentManager.get({
              entity: entityOnTile,
              component: Metadata,
            });

            if (entityOnTileMetadata) {
              log({
                componentManager: componentManager,
                message: `You are looking at: ${entityOnTileMetadata.name} - ${entityOnTileMetadata.description}`,
              });
            }
          }
        }

        // Only check for collision if the current entity has a turnComponent
        const checkForCollision = !!turnComponent;

        let allowedToMove = true;

        if (checkForCollision) {
          const collidablesOnNextTile = entitiesOnTile.reduce(
            (anyEntitiesOnTile, entityOnTile) => {
              if (entityOnTile === myEntity) {
                return anyEntitiesOnTile;
              }
              // Here is where you would dispatch a specific "collision" event!!
              // TODO DO GENERICS NOT CASTING
              const collidableHere = componentManager.has({
                entity: entityOnTile,
                component: Collidable,
              });

              if (collidableHere) {
                let entityOnTileName = entityOnTile;
                let entityOnTileMetadata = componentManager.get({
                  entity: entityOnTile,
                  component: Metadata,
                });
                if (entityOnTileMetadata) {
                  entityOnTileName = entityOnTileMetadata.name;
                }
                const currentEntityName = componentManager.get({
                  entity: myEntity,
                  component: Metadata,
                }).name;
                log({
                  componentManager: componentManager,
                  message: `${currentEntityName} bumped into ${entityOnTileName}.`,
                });

                const entityOnTileAttackable: ?Attackable = componentManager.get(
                  {
                    entity: entityOnTile,
                    component: Attackable,
                  }
                );

                if (entityOnTileAttackable) {
                  componentManager.add({
                    entity: entityOnTile,
                    components: [new Attacked({ by: myEntity })],
                  });

                  acted = true;
                }
              }
              return anyEntitiesOnTile || collidableHere;
            },
            false
          );

          if (collidablesOnNextTile) {
            // Here is where you would dispatch a generic "collision" event!!
            allowedToMove = false;
          }
        }

        if (allowedToMove) {
          transform.x = next_x;
          transform.y = next_y;
          acted = true;
        }

        if (turnComponent) {
          if (acted) {
            turnComponent.myTurn = false;
          }
        }
      }
    );
  }
}
