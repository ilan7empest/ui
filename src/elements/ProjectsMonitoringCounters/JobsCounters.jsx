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
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import StatsCard from '../../common/StatsCard/StatsCard'
import { Tooltip, TextTooltipTemplate, Loader } from 'igz-controls/components'

import { generateMonitoringStats } from '../../utils/generateMonitoringData'
import { JOBS_MONITORING_JOBS_TAB } from '../../constants'

import ClockIcon from 'igz-controls/images/clock.svg?react'

import './projectsMonitoringCounters.scss'

const JobsCounters = () => {
  const navigate = useNavigate()
  const projectStore = useSelector(store => store.projectStore)

  const jobStats = useMemo(
    () =>
      generateMonitoringStats(
        projectStore.jobsMonitoringData.jobs,
        navigate,
        JOBS_MONITORING_JOBS_TAB
      ),
    [navigate, projectStore.jobsMonitoringData.jobs]
  )

  return (
    <StatsCard className="monitoring-stats">
      <StatsCard.Header title="Jobs">
        <StatsCard.Col>
          <div className="project-card__info">
            <div
              className="stats__link"
              data-testid="jobs_total_counter"
              onClick={jobStats.total.link}
            >
              <span className="stats__subtitle">Total</span>
              <div className="stats__counter">
                {projectStore.projectsSummary.loading ? (
                  <Loader section small secondary />
                ) : (
                  jobStats.total.counter
                )}
              </div>
            </div>
            <div className="project-card__info-icon">
              <ClockIcon />
            </div>
            <span>Past 24 hours</span>
          </div>
        </StatsCard.Col>
      </StatsCard.Header>
      <StatsCard.Row>
        {jobStats.counters.map(({ counter, label, link, statusClass, tooltip }) => (
          <StatsCard.Col key={`${statusClass}-jobs`}>
            <div className="stats__link" onClick={link} data-testid={`jobs_${statusClass}_counter`}>
              <div className="stats__counter stats__counter-large">
                {projectStore.projectsSummary.loading ? (
                  <Loader section small secondary />
                ) : (
                  counter
                )}
              </div>
              <div data-testid={`jobs_${statusClass}_status`} className="stats__status">
                <Tooltip textShow template={<TextTooltipTemplate text={tooltip} />}>
                  <h6 className="stats__subtitle">{label}</h6>
                  <i className={`state-${statusClass}`} />
                </Tooltip>
              </div>
            </div>
          </StatsCard.Col>
        ))}
      </StatsCard.Row>
    </StatsCard>
  )
}

export default React.memo(JobsCounters)

/* Todo: use the structure below after  ML-5460 is impplemented

 <StatsCard className='monitoring-stats'>
      <StatsCard.Header title='Jobs and Workflows'>
        <DatePicker
          date={filter.dates.value[0]}
          dateTo={filter.dates.value[1]}
          selectedOptionId={PAST_24_HOUR_DATE_OPTION}
          label=''
          onChange={handleDateSelection}
          type='date-range-time'
          withLabels
        />
      </StatsCard.Header>
      <StatsCard.Row>
        <StatsCard.Col>{getCounterTemplate('jobs')}</StatsCard.Col>
        <StatsCard.Col>{getCounterTemplate('workflows')}</StatsCard.Col>
      </StatsCard.Row>
      <StatsCard.Row>
        <StatsCard.Col>
          <span className='link' onClick={jobStats.all.link}>
            See all
          </span>
        </StatsCard.Col>
        <StatsCard.Col>
          <span className='link' onClick={workflowsStats.all.link}>
            See all
          </span>
        </StatsCard.Col>
      </StatsCard.Row>
    </StatsCard>
  */
