/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import React from 'react'
import PropTypes from 'prop-types'
import pure from 'recompose/pure'
import BarSlicesItem from './BarSlicesItem'

const BarSlices = ({ slices, height, width, theme, tooltipFormat, showTooltip, hideTooltip }) => (
    <g>
        {slices.map(slice => (
            <g>
                <line
                    stroke="#e8e9e8"
                    style={{shapeRendering: 'crispEdges'}}
                    x1={slice.x}
                    x2={slice.x}
                    y1={0}
                    y2={height}
                />
                <BarSlicesItem
                    slice={slice}
                    theme={theme}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    x={slice.x}
                    width={width}
                    height={height}
                    tooltipFormat={tooltipFormat}
                />
            </g>
        ))}
    </g>
)

BarSlices.propTypes = {
    slices: PropTypes.arrayOf(
        PropTypes.shape({
            x: PropTypes.number.isRequired,
            width: PropTypes.number,
        })
    ).isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
}

export default pure(BarSlices)
