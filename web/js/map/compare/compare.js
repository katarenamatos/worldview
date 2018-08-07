import { Swipe } from './swipe';
import { Opacity } from './opacity';
import { Spy } from './spy';
import util from '../../util/util';

const TOUCH_EVENT = {
  type: 'touch',
  start: 'touchstart',
  move: 'touchmove',
  end: 'touchend'
};
const MOUSE_EVENT = {
  type: 'default',
  start: 'mousedown',
  move: 'mousemove',
  end: 'mouseup'
};
export function mapCompare(models, config) {
  var self = {};
  var comparison = null;
  var mode = 'swipe';
  var proj = '';
  self.events = util.events();
  self.swipe = Swipe;
  self.opacity = Opacity;
  self.spy = Spy;
  self.active = false;
  self.dragging = false;
  self.EventTypeObject = util.browser.touchDevice ? TOUCH_EVENT : MOUSE_EVENT;
  var init = function() {
    self.events
      .on('movestart', () => {
        self.dragging = true;
      })
      .on('moveend', value => {
        self.dragging = false;
        models.compare.setValue(value);
      });
  };
  self.update = function(group) {
    if (comparison) {
      comparison.update(models.compare.isCompareA, group);
    }
  };
  self.create = function(map, compareMode) {
    if (compareMode === mode && comparison && proj === models.proj.selected) {
      comparison.update(models.compare.isCompareA);
    } else if (comparison) {
      mode = compareMode;
      self.destroy();
      comparison = new self[compareMode](
        map,
        models.compare.isCompareA,
        self.events,
        self.EventTypeObject,
        models.compare.value || null
      ); // e.g. new self.swipe()
    } else {
      mode = compareMode;
      comparison = new self[compareMode](
        map,
        models.compare.isCompareA,
        self.events,
        self.EventTypeObject,
        models.compare.value || null
      ); // e.g. new self.swipe()
    }
    self.active = true;
    proj = models.proj.selected;
  };
  self.getOffset = function() {
    if (mode === 'swipe') {
      return comparison.getSwipeOffset();
    } else {
      return null;
    }
  };
  self.destroy = function() {
    comparison.destroy();
    models.compare.setValue(null); // Remove Value from state
    comparison = null;
    self.active = false;
  };
  init();
  return self;
}
