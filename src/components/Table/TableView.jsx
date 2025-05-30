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
import { isEmpty } from 'lodash'
import classnames from 'classnames'

import Details from '../Details/Details'
import TableHead from './TableHead'

import { ACTIONS_MENU, VIRTUALIZATION_CONFIG } from '../../types'
import { FULL_VIEW_MODE, MAIN_TABLE_BODY_ID, MAIN_TABLE_ID } from '../../constants'
import { SORT_PROPS } from 'igz-controls/types'

const TableView = ({
  actionsMenu,
  applyDetailsChanges = () => {},
  applyDetailsChangesCallback = () => {},
  children,
  detailsFormInitialValues,
  getCloseDetailsLink = null,
  handleCancel,
  hideActionsMenu,
  isTablePanelOpen,
  mainRowItemsCount,
  pageData,
  selectedItem,
  skipTableWrapper = false,
  sortProps = null,
  tab,
  tableBodyRef,
  tableClassName,
  tableContentRef,
  tableHeadRef,
  tableHeaders,
  tablePanelRef,
  tableRef,
  viewMode,
  virtualizationConfig,
  withActionMenu
}) => {
  const tableClass = classnames(
    'table',
    'table-main',
    !isEmpty(selectedItem) && 'table-with-details',
    tableClassName && tableClassName
  )
  const tableWrapperClass = classnames(!skipTableWrapper && 'table__wrapper')

  return (
    <div className="table__flex">
      <div className="table__content" id="table-content" ref={tableContentRef}>
        <div className={tableWrapperClass}>
          <table
            id={MAIN_TABLE_ID}
            className={tableClass}
            cellPadding="0"
            cellSpacing="0"
            ref={tableRef}
          >
            {tableHeaders?.length > 0 && (
              <TableHead
                content={tableHeaders}
                hideActionsMenu={hideActionsMenu}
                mainRowItemsCount={mainRowItemsCount}
                ref={tableHeadRef}
                selectedItem={selectedItem}
                sortProps={sortProps}
              />
            )}
            <tbody
              className="table-body"
              id={MAIN_TABLE_BODY_ID}
              style={{ paddingTop: virtualizationConfig.tableBodyPaddingTop }}
              ref={tableBodyRef}
            >
              {children}
            </tbody>
          </table>
          {isTablePanelOpen && (
            <div className="table__panel-container" ref={tablePanelRef}>
              <div className="table__panel">{pageData.tablePanel}</div>
            </div>
          )}
        </div>
        {!isEmpty(selectedItem) && viewMode !== FULL_VIEW_MODE && (
          <Details
            actionsMenu={actionsMenu}
            applyDetailsChanges={applyDetailsChanges}
            applyDetailsChangesCallback={applyDetailsChangesCallback}
            detailsMenu={pageData.details.menu}
            formInitialValues={detailsFormInitialValues}
            getCloseDetailsLink={getCloseDetailsLink}
            handleCancel={handleCancel}
            pageData={pageData}
            selectedItem={selectedItem}
            tab={tab}
            withActionMenu={withActionMenu}
          />
        )}
      </div>
    </div>
  )
}

TableView.propTypes = {
  actionsMenu: ACTIONS_MENU.isRequired,
  applyDetailsChanges: PropTypes.func,
  applyDetailsChangesCallback: PropTypes.func,
  children: PropTypes.node.isRequired,
  detailsFormInitialValues: PropTypes.object.isRequired,
  getCloseDetailsLink: PropTypes.func,
  handleCancel: PropTypes.func.isRequired,
  hideActionsMenu: PropTypes.bool.isRequired,
  isTablePanelOpen: PropTypes.bool.isRequired,
  mainRowItemsCount: PropTypes.number.isRequired,
  pageData: PropTypes.object.isRequired,
  selectedItem: PropTypes.object.isRequired,
  skipTableWrapper: PropTypes.bool,
  sortProps: SORT_PROPS,
  tab: PropTypes.string,
  tableBodyRef: PropTypes.object.isRequired,
  tableClassName: PropTypes.string.isRequired,
  tableContentRef: PropTypes.object.isRequired,
  tableHeadRef: PropTypes.object,
  tableHeaders: PropTypes.array,
  tablePanelRef: PropTypes.object,
  tableRef: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired,
  virtualizationConfig: VIRTUALIZATION_CONFIG.isRequired,
  withActionMenu: PropTypes.bool
}

export default TableView
