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
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { useParams } from 'react-router-dom'

import { ActionsMenu, TableCell } from 'igz-controls/components'

import { DETAILS_OVERVIEW_TAB } from '../../constants'
import { ACTIONS_MENU } from 'igz-controls/types'
import { getJobIdentifier } from '../../utils/getUniqueIdentifier'

const JobsTableRow = ({ actionsMenu, handleSelectJob = () => {}, rowItem, selectedJob = {} }) => {
  const params = useParams()
  const rowClassNames = classnames(
    'table-row',
    'table-body-row',
    'parent-row',
    getJobIdentifier(selectedJob, true) === rowItem.data.ui.identifierUnique && 'table-row_active'
  )

  return (
    <tr className={rowClassNames}>
      {rowItem.content.map((rowItemProp, index) => {
        return (
          !rowItemProp.hidden && (
            <TableCell
              cellData={rowItemProp}
              item={rowItem.data}
              key={`${rowItem.data.id}.${rowItemProp.header}.${index}`}
              link={
                rowItemProp.type === 'link'
                  ? rowItemProp.getLink?.(params.tab ?? DETAILS_OVERVIEW_TAB)
                  : ''
              }
              firstCell={index === 0}
              onClick={rowItemProp.handleClick}
              selectItem={handleSelectJob}
              selectedItem={selectedJob}
            />
          )
        )
      })}
      <td className="table-body__cell table-cell-icon">
        <ActionsMenu dataItem={rowItem.data} menu={actionsMenu} />
      </td>
    </tr>
  )
}

JobsTableRow.propTypes = {
  actionsMenu: ACTIONS_MENU.isRequired,
  handleSelectJob: PropTypes.func,
  rowItem: PropTypes.object.isRequired,
  selectedJob: PropTypes.object
}
export default JobsTableRow
