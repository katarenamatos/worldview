/* eslint-disable no-restricted-syntax */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeControls from './axis-timescale-change-controls';
import { timeScaleToNumberKey } from '../../../modules/date/constants';

/*
 * Parent element for timeScale change controls and tooltip
 * on the right side of the timeline
 *
 * @class AxisTimeScaleChange
 * @extends React.Component
 */
class AxisTimeScaleChange extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false,
    };
  }

  // TimeScale select tooltip on
  toolTipHoverOn = () => {
    const { isDraggerDragging } = this.props;
    if (!isDraggerDragging) { // in event of dragging off axis, prevent tooltip display
      this.disableMapScales(true);
      this.setState({
        toolTipHovered: true,
      });
    }
  }

  // TimeScale select tooltip off
  toolTipHoverOff = () => {
    this.disableMapScales(false);
    this.setState({
      toolTipHovered: false,
    });
  }

  // Toggle visibility of map scales
  disableMapScales = (disable) => {
    const imperialMapScale = document.querySelectorAll('.wv-map-scale-imperial');
    const metricMapScale = document.querySelectorAll('.wv-map-scale-metric');
    if (disable) {
      for (const el of imperialMapScale) {
        el.style.display = 'none';
      }
      for (const el of metricMapScale) {
        el.style.display = 'none';
      }
    } else {
      for (const el of imperialMapScale) {
        el.style.display = 'block';
      }
      for (const el of metricMapScale) {
        el.style.display = 'block';
      }
    }
  }

  // ex: month(2) to day(3)
  incrementTimeScale = () => {
    const {
      timeScale, hasSubdailyLayers, changeTimeScale,
    } = this.props;
    const timeScaleNumber = timeScaleToNumberKey[timeScale];
    const maxTimeScaleNumber = hasSubdailyLayers ? 5 : 3;
    if (timeScaleNumber < maxTimeScaleNumber) {
      changeTimeScale(timeScaleNumber + 1);
    }
  }

  // ex: day(3) to month(2)
  decrementTimeScale = () => {
    const {
      timeScale, changeTimeScale,
    } = this.props;
    const timeScaleNumber = timeScaleToNumberKey[timeScale];
    if (timeScaleNumber > 1) {
      changeTimeScale(timeScaleNumber - 1);
    }
  }

  render() {
    const {
      timeScale,
      timelineHidden,
      hasSubdailyLayers,
      changeTimeScale,
    } = this.props;
    const { toolTipHovered } = this.state;
    return (
      <div
        className="zoom-level-change"
        style={{
          display: timelineHidden ? 'none' : 'block',
        }}
      >
        { timeScale
          ? (
            <div
              onMouseEnter={this.toolTipHoverOn}
              onMouseLeave={this.toolTipHoverOff}
            >
              <AxisTimeScaleChangeControls
                timeScale={timeScale}
                hasSubdailyLayers={hasSubdailyLayers}
                toolTipHovered={toolTipHovered}
                changeTimeScale={changeTimeScale}
                incrementTimeScale={this.incrementTimeScale}
                decrementTimeScale={this.decrementTimeScale}
              />
            </div>
          )
          : null}
      </div>
    );
  }
}

AxisTimeScaleChange.propTypes = {
  changeTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  timelineHidden: PropTypes.bool,
  timeScale: PropTypes.string,
};

export default AxisTimeScaleChange;
