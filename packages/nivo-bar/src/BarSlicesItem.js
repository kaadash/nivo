import React, { Component } from 'react'
import PropTypes from 'prop-types'
import compose from 'recompose/compose'
import pure from 'recompose/pure'
import withState from 'recompose/withState'
import withHandlers from 'recompose/withHandlers'
import withPropsOnChange from 'recompose/withPropsOnChange'
import { TableTooltip } from '@nivo/core'

const hoverColor = '#e8e9e8'

const BarSlicesItem = ({ slice, x, height, width, showTooltip, hideTooltip, isHover }) => {
    return (
        <rect
            x={x}
            fill="black"
            fillOpacity={isHover ? 0.05 : 0}
            height={height}
            width={width}
            onMouseEnter={showTooltip}
            onMouseMove={showTooltip}
            onMouseLeave={hideTooltip}
        />
    )
}

BarSlicesItem.propTypes = {
    slice: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
    isHover: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
}

const Chip = ({ color }) => (
    <span
        style={{
            display: 'block',
            borderRadius: '50%',
            width: '6px',
            height: '6px',
            background: color,
        }}
    />
)

const enhance = compose(
    withState('isHover', 'setIsHover', false),
    withPropsOnChange(['slice', 'theme', 'tooltipFormat'], ({ slice, theme, tooltipFormat }) => {
        return {
            tooltip: <TableTooltip theme={theme}
                                   template={slice.data.template}
                                   rows={
              slice.tooltipData.map(({ name, value, format, color }) => {
                return [
                  <Chip color={color} />,
                  name,
                  tooltipFormat ? tooltipFormat(value, format) : value
                ];
              })
            } />,
        }
    }),
    withHandlers({
        showTooltip: ({ showTooltip, setIsHover, tooltip }) => e => {
            setIsHover(true)
            showTooltip(tooltip, e)
        },
        hideTooltip: ({ hideTooltip, setIsHover }) => () => {
            setIsHover(false)
            hideTooltip()
        },
    }),
    pure
)

export default enhance(BarSlicesItem)
