/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { FieldArray } from 'react-final-form-arrays'
import classNames from 'classnames'
import { capitalize, debounce, isEmpty } from 'lodash'
import { Form } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import { createForm } from 'final-form'

import Accordion from '../../common/Accordion/Accordion'
import {
  Button,
  PopUpDialog,
  FormInput,
  FormOnChange,
  TextTooltipTemplate,
  Tooltip
} from 'igz-controls/components'
import { SelectOption } from 'igz-controls/elements'

import { METRICS_SELECTOR_OPTIONS } from '../../types'
import { PRIMARY_BUTTON, TERTIARY_BUTTON } from 'igz-controls/constants'
import { filterMetrics, groupMetricByApplication, metricsTypes } from './metricsSelector.util'

import Arrow from 'igz-controls/images/arrow.svg?react'
import Caret from 'igz-controls/images/dropdown.svg?react'
import MetricIcon from 'igz-controls/images/circled-m.svg?react'
import ResultIcon from 'igz-controls/images/circled-r.svg?react'
import SearchIcon from 'igz-controls/images/search.svg?react'

import './metricsSelector.scss'

const MetricsSelector = ({
  applicationName = '',
  disabled = false,
  maxSelectionNumber = 20,
  metrics,
  name,
  onSelect = () => {},
  preselectedMetrics = []
}) => {
  const [nameFilter, setNameFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [appliedMetrics, setAppliedMetrics] = useState([])
  const selectorFieldRef = useRef()
  const formRef = React.useRef(
    createForm({
      initialValues: {
        metrics: [],
        metricSearchName: ''
      },
      mutators: { ...arrayMutators },
      onSubmit: () => {}
    })
  )

  const generatedMetrics = useMemo(() => {
    return groupMetricByApplication(metrics)
  }, [metrics])

  const filteredMetrics = useMemo(() => {
    return filterMetrics(generatedMetrics, nameFilter)
  }, [generatedMetrics, nameFilter])

  const setNameFilterDebounced = useMemo(
    () =>
      debounce(name => {
        setNameFilter(name)
      }, 500),
    [setNameFilter]
  )

  const metricsHeaderClassNames = classNames(
    'metrics-selector-header',
    isOpen && 'metrics-selector-header_open',
    disabled && 'metrics-selector-header_disabled'
  )

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.batch(() => {
        formRef.current.change(
          'metrics',
          appliedMetrics.map(metricItem => metricItem.full_name)
        )
        formRef.current.change('metricSearchName', '')
      })

      setNameFilter('')
    }
  }, [appliedMetrics, isOpen])

  useEffect(() => {
    if (preselectedMetrics) {
      formRef.current.reset({
        metrics: preselectedMetrics.map(metricItem => metricItem.full_name)
      })
      setAppliedMetrics(preselectedMetrics)
    }
  }, [preselectedMetrics])

  const windowClickHandler = useCallback(
    event => {
      if (
        !event.target.closest('.metrics-selector-popup') &&
        !event.target.closest('.metrics-selector') &&
        !event.target.closest('.tooltip-template') &&
        !event.target.closest('#overlay_container')
      ) {
        setIsOpen(false)
      }
    },
    [setIsOpen]
  )

  const windowScrollHandler = useCallback(
    event => {
      if (!event.target.closest('.metrics-selector-popup')) {
        setIsOpen(false)
      }
    },
    [setIsOpen]
  )

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('scroll', windowScrollHandler, true)
      window.addEventListener('click', windowClickHandler)
    }

    return () => {
      window.removeEventListener('click', windowClickHandler)
      window.removeEventListener('scroll', windowScrollHandler, true)
    }
  }, [windowClickHandler, windowScrollHandler, isOpen])

  const handleApply = () => {
    const newAppliedMetrics =
      formRef.current?.getFieldState('metrics')?.value?.map(metricFullName => {
        return metrics.find(metric => metric.full_name === metricFullName)
      }) || []

    onSelect(newAppliedMetrics)
    setAppliedMetrics(newAppliedMetrics)
    setIsOpen(false)
  }

  const handleClear = () => {
    formRef.current?.change('metrics', [])
  }

  const getSelectValue = () => {
    if (isEmpty(appliedMetrics)) {
      return 'Choose Metrics...'
    }

    if (appliedMetrics.length === 1) {
      return (
        metrics.find(metric => metric.full_name === appliedMetrics[0])?.name || '1 metric selected'
      )
    }

    return `${appliedMetrics.length} metrics selected`
  }

  const getMetricsLabel = metric => {
    return (
      <>
        <Tooltip
          className="metrics-selector-name"
          template={<TextTooltipTemplate text={metric.name} />}
        >
          <span className="data-ellipsis">{metric.name}</span>
        </Tooltip>
        <Tooltip
          className="metrics-selector-icon-type"
          template={<TextTooltipTemplate text={capitalize(metric.type)} />}
        >
          {metric.type === metricsTypes.metric ? <MetricIcon /> : <ResultIcon />}
        </Tooltip>
      </>
    )
  }

  return (
    <Form form={formRef.current} onSubmit={() => {}}>
      {formState => (
        <Tooltip
          hidden={!disabled}
          template={
            <TextTooltipTemplate text="No metrics to display due to one of: there are no applications configured; metrics were not logged yet due to lack of model invocations; model-monitoring hasn’t processed the results yet." />
          }
        >
          <div className="metrics-selector" data-testid="metrics-selector">
            <div
              data-testid="metric-selector-field"
              ref={selectorFieldRef}
              className="metric-selector-field"
            >
              <div
                data-testid="metrics-selector-header"
                className={metricsHeaderClassNames}
                onClick={() => setIsOpen(isOpen => !disabled && !isOpen)}
              >
                <div
                  data-testid="selected-metrics"
                  className="metrics-selector-header__selected-metrics data-ellipsis"
                >
                  <span>{getSelectValue(formState.values.metrics)}</span>
                </div>
                <div className="metrics-selector-header__icon">
                  <Caret />
                </div>
              </div>
              {isOpen && (
                <PopUpDialog
                  className="form-field form-field-select__options-list metrics-selector-popup"
                  headerIsHidden
                  customPosition={{
                    element: selectorFieldRef,
                    position: 'bottom-right',
                    autoHorizontalPosition: true
                  }}
                  style={{
                    width: '280px'
                  }}
                >
                  <div className="metrics-selector-search">
                    <div className="metrics-selector-search__name-filter">
                      <FormInput
                        inputIcon={<SearchIcon />}
                        name="metricSearchName"
                        placeholder="Search metrics..."
                      />
                      <FormOnChange name="metricSearchName" handler={setNameFilterDebounced} />
                    </div>
                  </div>

                  <ul className="metrics-selector-options options-list">
                    <FieldArray name={name}>
                      {({ fields }) => {
                        const renderMetrics = metricsList => {
                          return (
                            <ul className="metrics-selector-options">
                              {metricsList?.metrics?.map(metricItem => {
                                return (
                                  <SelectOption
                                    key={metricItem.id}
                                    item={{
                                      ...metricItem,
                                      label: getMetricsLabel(metricItem),
                                      disabled:
                                        fields.value?.length >= maxSelectionNumber &&
                                        !fields.value.includes(metricItem.id)
                                    }}
                                    name={name}
                                    multiple
                                  />
                                )
                              })}{' '}
                            </ul>
                          )
                        }

                        return (
                          <>
                            {applicationName
                              ? renderMetrics(filteredMetrics[0] || {})
                              : filteredMetrics.map(metricsGroup => {
                                  return !isEmpty(metricsGroup.metrics) ? (
                                    <Accordion
                                      key={metricsGroup.app}
                                      accordionClassName="metrics-selector-accordion"
                                      icon={<Arrow />}
                                      iconClassName="metrics-selector-accordion-icon"
                                      openByDefault
                                    >
                                      <div className="metrics-selector-accordion-content">
                                        <div className="metrics-selector-accordion-title">
                                          {metricsGroup.app}
                                        </div>
                                        <ul className="metrics-selector-options">
                                          {renderMetrics(metricsGroup)}
                                        </ul>
                                      </div>
                                    </Accordion>
                                  ) : null
                                })}
                          </>
                        )
                      }}
                    </FieldArray>
                  </ul>
                  <div className="metrics-selector__footer">
                    <div
                      data-testid="metrics-selector-counter"
                      className="metrics-selector__footer-counter"
                    >
                      {`${formState.values.metrics?.length ?? 0}/${maxSelectionNumber}`}
                    </div>
                    <div
                      data-testid="metrics-selector-buttons"
                      className="metrics-selector__footer-buttons"
                    >
                      <Button variant={TERTIARY_BUTTON} label="Clear" onClick={handleClear} />
                      <Button variant={PRIMARY_BUTTON} label="Apply" onClick={handleApply} />
                    </div>
                  </div>
                </PopUpDialog>
              )}
            </div>
          </div>
        </Tooltip>
      )}
    </Form>
  )
}

MetricsSelector.propTypes = {
  applicationName: PropTypes.string,
  disabled: PropTypes.bool,
  maxSelectionNumber: PropTypes.number,
  metrics: METRICS_SELECTOR_OPTIONS.isRequired,
  name: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
  preselectedMetrics: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired }))
}

export default MetricsSelector
