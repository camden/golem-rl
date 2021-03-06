// @flow

import { System } from 'systems/system';
import type { Entity } from 'entity';
import {
  Actor,
  Attackable,
  Attacked,
  Metadata,
  PlayerControlled,
  Transform,
  Turn,
} from 'component';
import ComponentManager from 'component-manager';
import { log } from 'utils';

// TODO should this belong in utils?
import { getEntitiesWithin, getPathToTarget } from 'utils';

export default class AISystem implements System {
  componentManager: ComponentManager;
  game: *;

  constructor(componentManager: ComponentManager, game: *) {
    this.componentManager = componentManager;
    this.game = game;
  }

  update(entities: Array<Entity>) {
    for (let myEntity of entities) {
      // TODO pull this out
      const turnComponent = this.componentManager.get({
        entity: myEntity,
        component: Turn,
      });
      const actorComponent = this.componentManager.get({
        entity: myEntity,
        component: Actor,
      });

      if (turnComponent && actorComponent) {
        if (!turnComponent.myTurn) {
          return;
        }

        const transformComponent = this.componentManager.get({
          entity: myEntity,
          component: Transform,
        });

        if (transformComponent) {
          for (let tactic of actorComponent.tactics) {
            if (!tactic.name) {
              throw new Error('Every tactic must have a name!');
            }

            let acted = false;
            switch (tactic.name) {
              case 'attack_adjacent': {
                const nearbyEntities = getEntitiesWithin({
                  componentManager: this.componentManager,
                  transform: transformComponent,
                  distance: 1,
                }).filter(entity => {
                  // TODO For now, do it like this
                  // in the future, add a "hostility" to dynamically determine
                  // what entity you are targeting
                  const entityPlayerComponent = this.componentManager.get({
                    entity: entity,
                    component: PlayerControlled,
                  });

                  return !!entityPlayerComponent;
                });

                if (nearbyEntities.length === 0) {
                  break;
                }

                const target = nearbyEntities[0];

                if (target) {
                  const targetAttackable: ?Attackable = this.componentManager.get(
                    {
                      entity: target,
                      component: Attackable,
                    }
                  );

                  if (targetAttackable) {
                    this.componentManager.add({
                      entity: target,
                      components: [new Attacked({ by: myEntity })],
                    });
                    acted = true;
                  }
                }

                break;
              }
              case 'move_towards_player': {
                const nearby_distance = tactic.params.sight;
                const nearbyEntities = getEntitiesWithin({
                  componentManager: this.componentManager,
                  transform: transformComponent,
                  distance: nearby_distance,
                }).filter(entity => {
                  // TODO For now, do it like this
                  // in the future, add a "hostility" to dynamically determine
                  // what entity you are targeting
                  const entityPlayerComponent = this.componentManager.get({
                    entity: entity,
                    component: PlayerControlled,
                  });

                  return !!entityPlayerComponent;
                });

                const target = nearbyEntities[0];
                if (target) {
                  const targetTransform = this.componentManager.get({
                    entity: target,
                    component: Transform,
                  });

                  if (targetTransform) {
                    const path = getPathToTarget({
                      componentManager: this.componentManager,
                      transform: transformComponent,
                      targetTransform: targetTransform,
                    });

                    if (path[0]) {
                      transformComponent.x = path[0].x;
                      transformComponent.y = path[0].y;
                      acted = true;
                    } else {
                      console.log('COULD NOT FIND PATH');
                    }
                  }
                }
                break;
              }
              case 'wander': {
                console.log("I'm wandering!");
                const myTransform = this.componentManager.get({
                  entity: myEntity,
                  component: Transform,
                });
                // Pick a new location

                // Can I move there?
                acted = true;
                break;
              }
              default: {
                acted = true;
                throw new Error(`${tactic.name} not found!`);
                break;
              }
            }

            if (acted) {
              turnComponent.myTurn = true;
              // Stop looking for new tactics
              break;
            }
          }
        }

        const metadata = this.componentManager.get({
          entity: myEntity,
          component: Metadata,
        });

        if (metadata) {
          console.log(`${metadata.name} acted.`);
        }

        turnComponent.myTurn = false;
      }
    }
  }
}
