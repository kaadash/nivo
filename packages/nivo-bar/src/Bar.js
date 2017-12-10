/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import React from 'react'
import { TransitionMotion, spring } from 'react-motion'
import { bindDefs } from '@nivo/core'
import { generateGroupedBars, generateStackedBars } from './compute'
import setDisplayName from 'recompose/setDisplayName'
import enhance from './enhance'
import { BarPropTypes } from './props'
import BarSlices from './BarSlices'
import { Container, SvgWrapper } from '@nivo/core'
import { Grid, Axes } from '@nivo/core'
import { CartesianMarkers, computeAxisTicks } from '@nivo/core'
import { map, groupBy } from 'lodash';

const barWillEnterHorizontal = ({ style }) => ({
    x: style.x.val,
    y: style.y.val,
    width: 0,
    height: style.height.val,
})

const barWillEnterVertical = ({ style }) => ({
    x: style.x.val,
    y: style.y.val + style.height.val,
    width: style.width.val,
    height: 0,
})

const barWillLeaveHorizontal = springConfig => ({ style }) => ({
    x: style.x,
    y: style.y,
    width: spring(0, springConfig),
    height: style.height,
})

const barWillLeaveVertical = springConfig => ({ style }) => ({
    x: style.x,
    y: spring(style.y.val + style.height.val, springConfig),
    width: style.width,
    height: spring(0, springConfig),
})

const prepareSlices = bars => {
  return map(groupBy(bars, bar => bar.data.indexValue), value => value)
}

const Bar = ({
    data,
    getIndex,
    keys,
    keyNames,
    templates,
    enableTemplates,

    groupMode,
    layout,
    reverse,
    minValue,
    maxValue,

    margin,
    width,
    height,
    outerWidth,
    outerHeight,
    padding,
    innerPadding,

    // axes & grid
    axisTop,
    axisRight,
    axisBottom,
    axisLeft,
    enableGridX,
    enableGridY,

    // customization
    barComponent,

    // labels
    enableLabel,
    getLabel,
    labelSkipWidth,
    labelSkipHeight,
    getLabelTextColor,

    // markers
    markers,

    // theming
    theme,
    getColor,
    defs,
    fill,
    borderRadius,
    borderWidth,
    getBorderColor,

    // motion
    animate,
    motionStiffness,
    motionDamping,

    // interactivity
    isInteractive,
    tooltipFormat,
    onClick,
}) => {
    const options = {
        layout,
        reverse,
        data,
        getIndex,
        keys,
        keyNames,
        templates,
        minValue,
        maxValue,
        width,
        height,
        getColor,
        padding,
        innerPadding,
    }
    const result =
        groupMode === 'grouped' ? generateGroupedBars(options) : generateStackedBars(options)
    console.log(result.bars, result.slices);
    const motionProps = {
        animate,
        motionDamping,
        motionStiffness,
    }

    const springConfig = {
        damping: motionDamping,
        stiffness: motionStiffness,
    }

    const willEnter = layout === 'vertical' ? barWillEnterVertical : barWillEnterHorizontal
    const willLeave =
        layout === 'vertical'
            ? barWillLeaveVertical(springConfig)
            : barWillLeaveHorizontal(springConfig)

    const shouldRenderLabel = ({ width, height }) => {
        if (!enableLabel) return false
        if (labelSkipWidth > 0 && width < labelSkipWidth) return false
        if (labelSkipHeight > 0 && height < labelSkipHeight) return false
        return true
    }

    const boundDefs = bindDefs(defs, result.bars, fill, {
        dataKey: 'data',
        targetKey: 'data.fill',
    })
    const { y, ticks } = computeAxisTicks({
        width,
        height,
        scale: result.xScale,
        position: 'bottom',
    })

    const slices = prepareSlices(result.bars)

    return (
        <Container isInteractive={isInteractive} theme={theme}>
            {({ showTooltip, hideTooltip }) => {
                const commonProps = {
                    borderRadius,
                    borderWidth,
                    enableLabel,
                    labelSkipWidth,
                    labelSkipHeight,
                    showTooltip,
                    hideTooltip,
                    onClick,
                    theme,
                    tooltipFormat,
                }

                let bars
                if (animate === true) {
                    bars = (
                        <TransitionMotion
                            willEnter={willEnter}
                            willLeave={willLeave}
                            styles={result.bars.map(bar => ({
                                key: bar.key,
                                data: bar,
                                style: {
                                    x: spring(bar.x, springConfig),
                                    y: spring(bar.y, springConfig),
                                    width: spring(bar.width, springConfig),
                                    height: spring(bar.height, springConfig),
                                },
                            }))}
                        >
                            {interpolatedStyles => (
                                <g>
                                    {interpolatedStyles.map(({ key, style, data: bar }) => {
                                        const baseProps = { ...bar, ...style }

                                        return React.createElement(barComponent, {
                                            key,
                                            ...baseProps,
                                            ...commonProps,
                                            shouldRenderLabel: shouldRenderLabel(baseProps),
                                            width: Math.max(style.width, 0),
                                            height: Math.max(style.height, 0),
                                            label: getLabel(bar.data),
                                            labelColor: getLabelTextColor(baseProps, theme),
                                            borderColor: getBorderColor(baseProps),
                                        })
                                    })}
                                </g>
                            )}
                        </TransitionMotion>
                    )
                } else {
                    bars = result.bars.map(d =>
                        React.createElement(barComponent, {
                            key: d.key,
                            ...d,
                            ...commonProps,
                            label: getLabel(d.data),
                            shouldRenderLabel: shouldRenderLabel(d),
                            labelColor: getLabelTextColor(d, theme),
                            borderColor: getBorderColor(d),
                        })
                    )
                }


                const renderTicks = (templates) => {
                    return ticks.map(({x}, index) => {
                       return (
                            <div
                                className="bar-chart__axis"
                                key={x}
                                style={{
                                    transform: `translateX(${x + margin.left}px)`,
                                    top: `${y + 15}px`
                                }}
                            >
                                <div className="bar-chart__axis-item">
                                    <div>
                                        <div>{templates[index]}</div>
                                    </div>
                                </div>
                            </div>
                       ) ;
                    });
                }

                return (
                    <div>
                        <SvgWrapper
                            width={outerWidth}
                            height={outerHeight}
                            margin={margin}
                            defs={boundDefs}
                        >
                            <Grid
                                theme={theme}
                                width={width}
                                height={height}
                                xScale={enableGridX ? result.xScale : null}
                                yScale={enableGridY ? result.yScale : null}
                                {...motionProps}
                            />
                            <Axes
                                xScale={result.xScale}
                                yScale={result.yScale}
                                width={width}
                                enableTemplates={enableTemplates}
                                height={height}
                                theme={theme}
                                top={axisTop}
                                right={axisRight}
                                bottom={axisBottom}
                                left={axisLeft}
                                {...motionProps}
                            />
                            {bars}
                            {
                                layout === 'vertical'
                                  ?
                                      <BarSlices
                                        theme={theme}
                                        slices={result.slices}
                                        showTooltip={showTooltip}
                                        hideTooltip={hideTooltip}
                                        width={result.slices[0].width}
                                        height={height}
                                        tooltipFormat={tooltipFormat}
                                      />
                                  : ''
                            }
                            <CartesianMarkers
                                markers={markers}
                                width={width}
                                height={height}
                                xScale={result.xScale}
                                yScale={result.yScale}
                                theme={theme}
                            />
                        </SvgWrapper>
                        {enableTemplates ? renderTicks(templates) : ''}
                    </div>
                )
            }}
        </Container>
    )
}

Bar.propTypes = BarPropTypes

export default setDisplayName('Bar')(enhance(Bar))
