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
import { Loader } from 'igz-controls/components'

import { generateMonitoringStats } from '../../utils/generateMonitoringData'
import { JOBS_MONITORING_SCHEDULED_TAB } from '../../constants'

import ClockIcon from 'igz-controls/images/clock.svg?react'

import './projectsMonitoringCounters.scss'

const ScheduledJobsCounters = () => {
  const navigate = useNavigate()
  const projectStore = useSelector(store => store.projectStore)

  const scheduledStats = useMemo(
    () =>
      generateMonitoringStats(
        projectStore.jobsMonitoringData.scheduled,
        navigate,
        JOBS_MONITORING_SCHEDULED_TAB
      ),
    [navigate, projectStore.jobsMonitoringData.scheduled]
  )

  return (
    <StatsCard className="monitoring-stats">
      <StatsCard.Header title="Scheduled">
        <StatsCard.Col>
          <div className="project-card__info">
            <div
              className="stats__link"
              data-testid="scheduled_total_counter"
              onClick={scheduledStats.total.link}
            >
              <span className="stats__subtitle">Total</span>
              <div className="stats__counter">
                {projectStore.projectsSummary.loading ? (
                  <Loader section small secondary />
                ) : (
                  scheduledStats.total.counter
                )}
              </div>
            </div>
            <div className="project-card__info-icon">
              <ClockIcon />
            </div>
            <span>Next 24 hours</span>
          </div>
        </StatsCard.Col>

        {/* Todo: Use in the future
        <DatePicker
          date={filter.dates.value[0]}
          dateTo={filter.dates.value[1]}
          hasFutureOptions
          selectedOptionId={NEXT_24_HOUR_DATE_OPTION}
          label=""
          onChange={handleDateSelection}
          type="date-range-time"
          withLabels
        /> */}
      </StatsCard.Header>
      <StatsCard.Row>
        <StatsCard.Col>
          <div
            className="stats__link"
            onClick={scheduledStats.jobs.link}
            data-testid="scheduled_jobs_counter"
          >
            <div className="stats__counter stats__counter-large">
              {projectStore.projectsSummary.loading ? (
                <Loader section small secondary />
              ) : (
                scheduledStats.jobs.counter
              )}
            </div>
            <h6 className="stats__subtitle">Jobs</h6>
          </div>
        </StatsCard.Col>
        <StatsCard.Col>
          <div
            className="stats__link"
            onClick={scheduledStats.workflows.link}
            data-testid="scheduled_wf_counter"
          >
            <div className="stats__counter stats__counter-large">
              {projectStore.projectsSummary.loading ? (
                <Loader section small secondary />
              ) : (
                scheduledStats.workflows.counter
              )}
            </div>
            <h6 className="stats__subtitle">Workflows</h6>
          </div>
        </StatsCard.Col>
      </StatsCard.Row>
    </StatsCard>
  )
}

export default React.memo(ScheduledJobsCounters)
