import {
  assign as lodashAssign,
  find as lodashFind,
  get as lodashGet
} from 'lodash';
import { Stroke, Style, Fill, Circle, Text } from 'ol/style';
import { setStyleFunction } from './selectors';
import { isFromActiveCompareRegion } from '../compare/util';
export function getVectorStyleAttributeArray(layer) {
  var isCustomActive = false;
  var isMinActive = false;
  var isMaxActive = false;
  if (layer.custom) { isCustomActive = true; }
  if (layer.min) { isMinActive = true; }
  if (layer.max) { isMaxActive = true; }
  const styleObj = lodashAssign({}, { key: 'custom', value: layer.custom, isActive: isCustomActive });
  const minObj = lodashAssign({}, { key: 'min', value: layer.min, isActive: isMinActive });
  const maxObj = lodashAssign({}, { key: 'max', value: layer.max, isActive: isMaxActive });
  const attrArray = [];

  [styleObj, minObj, maxObj].forEach(obj => {
    if (obj.isActive) {
      attrArray.push({
        id: obj.key === 'custom' ? 'style' : obj.key,
        value: obj.value
      });
    } else {
      if (obj.isActive) {
        attrArray.push({
          id: obj.key === 'custom' ? 'style' : obj.key,
          value: ''
        });
      }
    }
  });
  return attrArray;
}

export function getMinValue(v) {
  return v.length ? v[0] : v;
}

export function getMaxValue(v) {
  return v.length ? v[v.length - 1] : v;
}
export function isConditional(item) {
  return Array.isArray(item) && item[0] === 'case';
}

export function selectedCircleStyle(style) {
  const styleImage = style.getImage();
  const fill = styleImage.getFill();
  const radius = styleImage.getRadius() * 2;
  return new Style({
    image: new Circle({
      radius: radius,
      stroke: new Stroke({
        color: 'white',
        width: 2
      }),
      fill: new Fill({
        color: fill.getColor().replace(/[^,]+(?=\))/, '0.5')
      })
    })
  });
}
export function selectedPolygonStyle(style) {
  const fill = style.getFill();
  const color = fill.getColor().replace(/[^,]+(?=\))/, '0.5');
  const stroke = style.getStroke();
  stroke.setColor('white');
  stroke.setWidth(0.5);
  fill.setColor(color);
  return style;
}
export function offsetLineStringStyle(feature, styleArray) {
  return styleArray.map(style => {
    const text = style.getText();
    if (text) {
      text.setOffsetX(25)
    }
    return style;
  });
}
export function selectedStyleFunction(feature, styleArray) {
  if (styleArray.length !== 1) return styleArray;
  return styleArray.map((style) => {
    const type = feature.getType();
    switch (type) {
      case 'Point':
        return selectedCircleStyle(style);
      case 'Polygon':
        return selectedPolygonStyle(style);
      default:
        return style;
    }
  });
}
export function getConditionalColors(color) {
  const array = Array.from(color);
  array.shift();
  const colors = [];
  const labels = [];
  let temp = [];
  const chunk = 2;
  // https://stackoverflow.com/a/8495740/4589331
  for (let i = 0, j = array.length; i < j; i += chunk) {
    temp = array.slice(i, i + chunk);
    if (temp.length === 2) {
      if (temp[0].length === 3 &&
        typeof temp[0][2] === 'string' &&
        typeof temp[1] === 'string'
      ) {
        labels.push(temp[0][2]);
        colors.push(temp[1]);
      } else {
        console.warn('Irregular conditional');
      }
    } else if (temp.length === 1 && typeof temp[0] === 'string') {
      labels.push('Default');
      colors.push(temp[0]);
    } else {
      console.warn('Irregular conditional');
    }
  }
  return { colors, labels };
}
export function getPaletteForStyle(layer, layerstyleLayerObject) {
  const styleLayerObject = layerstyleLayerObject.layers[0];
  const color = styleLayerObject.paint['line-color'] || styleLayerObject.paint['circle-color'] || styleLayerObject.paint['fill-color'];
  const isConditionalStyling = styleLayerObject.paint ? isConditional(color) : false;
  let colors = [];
  let labels = [];
  if (isConditionalStyling) {
    const expressionObj = getConditionalColors(color);
    colors = expressionObj.colors;
    labels = expressionObj.labels;
  } else {
    colors.push(color);
    labels.push(layer.title);
  }
  return [{
    colors: colors,
    type: 'classification',
    tooltips: labels,
    title: layer.title,
    id: layer.id + '0_legend'
  }];
}
export function onMapClickGetVectorFeatures(pixels, map, state, swipeOffset) {
  const metaArray = [];
  const selected = {};
  const config = state.config;
  const { screenWidth, screenHeight, lessThan } = state.browser;
  const isMobile = lessThan.medium;

  const x = pixels[0];
  const y = pixels[1];
  const isOnLeft = screenWidth - x >= screenWidth / 2;
  const modalWidth = isMobile ? 250 : 445;
  const modalHeight = 300;
  let offsetLeft = isOnLeft ? x + 20 : x - modalWidth - 20;
  let offsetTop = y - (modalHeight / 2);

  if (offsetLeft < 0) {
    offsetLeft = 20;
  } else if (offsetLeft + modalWidth > screenWidth) {
    offsetLeft = screenWidth - modalWidth - 20;
  }
  if (offsetTop < 0) {
    offsetTop = 20;
  } else if (offsetTop + modalHeight > screenHeight) {
    offsetTop = y - modalHeight;
  }

  map.forEachFeatureAtPixel(pixels, function (feature, layer) {
    const def = lodashGet(layer, 'wv.def');
    if (!def) return;
    if (!isFromActiveCompareRegion(map, pixels, layer.wv, state.compare, swipeOffset)) return;
    if (def.vectorData && def.vectorData.id && def.title) {
      const layerId = def.id;
      if (!selected[layerId]) selected[layerId] = [];
      const features = feature.getProperties();
      const vectorDataId = def.vectorData.id;
      const data = config.vectorData[vectorDataId];
      const properties = data.mvt_properties;
      const uniqueIdentifierKey = lodashFind(properties, { Function: 'Identify' }).Identifier;
      const titleObj = lodashFind(properties, { IsLabel: 'True' });
      const titleKey = titleObj.Identifier;

      const uniqueIdentifier = features[uniqueIdentifierKey];
      const title = titleKey ? features[titleKey] : 'Unknown title';
      if (selected[layerId].includes(uniqueIdentifier)) return;
      const obj = {
        legend: properties,
        features: features,
        id: vectorDataId,
        title: def.title || def.id,
        featureTitle: title

      };
      metaArray.push(obj);
      selected[layerId].push(uniqueIdentifier);
    }
  });
  return { selected, metaArray, offsetLeft, offsetTop };
}
export function updateVectorSelection(selectionObj, lastSelection, layers, type, state) {
  const vectorStyles = state.config.vectorStyles;
  for (const [key] of Object.entries(selectionObj)) {
    const def = lodashFind(layers, { id: key });
    if (!def) return;
    setStyleFunction(def, def.vectorStyle.id, vectorStyles, null, state);
    if (lastSelection[key]) delete lastSelection[key];
  }
  for (const [key] of Object.entries(lastSelection)) {
    const def = lodashFind(layers, { id: key });
    if (!def) return;
    setStyleFunction(
      def,
      def.vectorStyle.id,
      vectorStyles,
      null,
      state
    );
  }
}
