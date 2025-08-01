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
import { capitalize } from 'lodash'

import { formatDatetime } from 'igz-controls/utils/datetime.util'
import { generateNuclioLink } from './parseUri'

export const createApplicationContent = (application, projectName) => {
  const identifierUnique = 'identifierUnique.' + application.name + application.application_class

  return {
    data: {
      ...application,
      state: {
        value: application.status,
        className: `state-${application.status}`,
        label: capitalize(application.status)
      }
    },
    content: [
      {
        id: `key.${identifierUnique}`,
        headerId: 'name',
        headerLabel: 'Name',
        value: capitalize(application.name),
        className: 'table-cell-name',
        getLink: () => application.name
      },
      {
        id: `lag.${identifierUnique}`,
        headerId: 'lag',
        headerLabel: 'Lag',
        tip: "Number of messages currently waiting in the app's queue",
        value: application.stats.stream_stats?.lag ?? 0,
        className: 'table-cell-1'
      },
      {
        id: `commitedOffset.${identifierUnique}`,
        headerId: 'commitedOffset',
        tip: 'Total number of messages handled by the app',
        headerLabel: 'Commited offset',
        value: application.stats.stream_stats.committed ?? 0,
        className: 'table-cell-2'
      },
      {
        id: `detections.${identifierUnique}`,
        headerId: 'detections',
        headerLabel: 'Detections',
        value: application.stats.detected,
        className: 'table-cell-1'
      },
      {
        id: `possibleDetections.${identifierUnique}`,
        headerId: 'possibleDetections',
        headerLabel: 'Possible detections',
        value: application.stats.potential_detection,
        className: 'table-cell-2'
      },
      {
        id: `class.${identifierUnique}`,
        headerId: 'class',
        headerLabel: 'Class',
        value: application.application_class,
        className: 'table-cell-2'
      },

      {
        id: `updated.${identifierUnique}`,
        headerId: 'updated',
        headerLabel: 'Updated',
        value: formatDatetime(application.updated_time, 'N/A'),
        className: 'table-cell-2'
      },
      {
        id: `nuclioFunction.${identifierUnique}`,
        headerId: 'nuclioFunction',
        headerLabel: 'Nuclio function',
        value: application.name,
        className: 'table-cell-2',
        getLink: () => generateNuclioLink(`/projects/${projectName}/functions/${application.name}`),
        showStatus: true
      }
    ]
  }
}
