// @flow
import { keyMap, getCommand } from 'input';
import type { Entity } from 'entity';
import {
  Actor,
  Metadata,
  Player,
  Renderable,
  Tactics,
  Transform,
  Turn,
} from 'component';
import ComponentManager from 'component-manager';
import MapConfig from 'config/map.json';

export interface System {
  update(entities: Array<Entity>): void,
}

// TODO move each one into its own file
export class AISystem implements System {
  componentManager: ComponentManager;
  game: *;

  constructor(componentManager: ComponentManager, game: *) {
    this.componentManager = componentManager;
    this.game = game;
  }

  update(entities: Array<Entity>) {
    // TODO In the future, do this:
    // https://github.com/libgdx/ashley/wiki/How-to-use-Ashley#entity-systems
    for (let entity of entities) {
      // TODO pull this out
      const turnComponent = this.componentManager.get({
        entity: entity,
        component: Turn,
      });
      const actorComponent = this.componentManager.get({
        entity: entity,
        component: Actor,
      });

      if (turnComponent && actorComponent) {
        if (!turnComponent.myTurn) {
          return;
        }

        const tacticsComponent = this.componentManager.get({
          entity: entity,
          component: Tactics,
        });

        tacticsComponent.tactic.execute();

        const metadata = this.componentManager.get({
          entity: entity,
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

export class TurnSystem implements System {
  componentManager: ComponentManager;
  game: *;

  constructor(componentManager: ComponentManager, game: *) {
    this.componentManager = componentManager;
    this.game = game;
  }

  update(entities: Array<Entity>) {
    // TODO In the future, do this:
    // https://github.com/libgdx/ashley/wiki/How-to-use-Ashley#entity-systems
    let nextToAct: Turn;

    for (let entity of entities) {
      // TODO pull this out
      const turnComponent = this.componentManager.get({
        entity: entity,
        component: Turn,
      });

      if (turnComponent) {
        if (turnComponent.myTurn) {
          // TODO Add helper for getting name
          const metadata = this.componentManager.get({
            entity: entity,
            component: Metadata,
          });

          if (metadata) {
            // console.log(`${metadata.name}'s turn to act.'`);
          }
          return;
        }

        if (!nextToAct) {
          nextToAct = turnComponent;
        }

        if (turnComponent.nextTurnTime < nextToAct.nextTurnTime) {
          nextToAct = turnComponent;
        }
      }
    }

    if (!nextToAct) {
      throw new Error('Could not find next actor to act.');
    }

    nextToAct.myTurn = true;
    nextToAct.nextTurnTime += nextToAct.speed;
  }
}

export class RenderSystem implements System {
  componentManager: ComponentManager;
  game: *;
  // TODO remove this
  draw: Function;
  clear: Function;
  map: Array<Array<*>>;

  constructor(componentManager: ComponentManager, game: *) {
    this.componentManager = componentManager;
    this.game = game;

    // Init map - should this be somewhere else?
    const MAP_WIDTH = MapConfig.width;
    const MAP_HEIGHT = MapConfig.height;
    const blankChar = '·';
    // TODO this is ugly... use a camera
    const spacing = 20;
    const x_offset = 30;
    const y_offset = 300;
    this.map = new Array(MAP_WIDTH);

    for (let x = 0; x < MAP_WIDTH; x++) {
      this.map[x] = [];
      for (let y = 0; y < MAP_HEIGHT; y++) {
        const cell = this.game.add.text(
          x_offset + x * spacing,
          // Multiply by -1 to make origin at bottom left
          y_offset + y * spacing * -1,
          blankChar,
          {
            font: '10pt Monaco, monospace',
          }
        );
        this.map[x][y] = cell;
      }
    }

    this.clear = () => {
      for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
          this.map[x][y].setText(blankChar);
        }
      }
    };

    this.draw = ({ x, y, glyph }) => {
      if (x < 0 || x >= MAP_WIDTH) {
        return;
      }

      if (y < 0 || y >= MAP_HEIGHT) {
        return;
      }

      this.map[x][y].setText(glyph);
    };
  }

  update(entities: Array<Entity>) {
    this.clear();
    for (let entity of entities) {
      const renderable = this.componentManager.get({
        entity: entity,
        component: Renderable,
      });
      const transform = this.componentManager.get({
        entity: entity,
        component: Transform,
      });

      // Eventually do a bitmask?
      if (renderable && transform) {
        // TODO Rename this
        this.draw({
          x: transform.x,
          y: transform.y,
          glyph: renderable.glyph,
        });
      }
    }
  }
}
