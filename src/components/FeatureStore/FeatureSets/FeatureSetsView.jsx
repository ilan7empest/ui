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
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { Loader } from 'igz-controls/components'
import FeatureSetsPanel from '../../FeatureSetsPanel/FeatureSetsPanel'
import FeatureStoreTableRow from '../../../elements/FeatureStoreTableRow/FeatureStoreTableRow'
import NoData from '../../../common/NoData/NoData'
import Table from '../../Table/Table'
import ActionBar from '../../ActionBar/ActionBar'
import FeatureStoreFilters from '../FeatureStoreFilters'
import FeatureStorePageTabs from '../FeatureStorePageTabs/FeatureStorePageTabs'

import { FEATURE_SETS_TAB, FEATURE_STORE_PAGE } from '../../../constants'
import { PRIMARY_BUTTON } from 'igz-controls/constants'
import { VIRTUALIZATION_CONFIG } from 'igz-controls/types'
import { filtersConfig } from './featureSets.util'
import { getNoDataMessage } from '../../../utils/getNoDataMessage'
import { isRowRendered } from '../../../hooks/useVirtualization.hook'
import { createFeatureSetTitle } from '../featureStore.util'

const FeatureSetsView = React.forwardRef(
  (
    {
      actionsMenu,
      applyDetailsChanges,
      applyDetailsChangesCallback,
      closePanel,
      createFeatureSetSuccess,
      detailsFormInitialValues,
      featureSets,
      featureSetsPanelIsOpen,
      featureStore,
      filters,
      filtersStore,
      handleRefresh,
      pageData,
      requestErrorMessage,
      selectedFeatureSet,
      selectedRowData,
      setFeatureSetsPanelIsOpen,
      setSearchParams,
      setSelectedFeatureSetMin,
      tableContent,
      toggleRow,
      virtualizationConfig
    },
    { featureStoreRef }
  ) => {
    const params = useParams()

    return (
      <div className="feature-store" ref={featureStoreRef}>
        <div className="content__action-bar-wrapper">
          <FeatureStorePageTabs />
          <ActionBar
            actionButtons={[
              {
                className: 'action-button',
                label: createFeatureSetTitle,
                variant: PRIMARY_BUTTON,
                onClick: () => setFeatureSetsPanelIsOpen(true)
              }
            ]}
            closeParamName={FEATURE_SETS_TAB}
            filters={filters}
            filtersConfig={filtersConfig}
            handleRefresh={handleRefresh}
            setSearchParams={setSearchParams}
            tab={FEATURE_SETS_TAB}
            withoutExpandButton
          >
            <FeatureStoreFilters content={featureSets} />
          </ActionBar>
        </div>
        {featureStore.loading ? null : featureSets.length === 0 ? (
          <NoData
            message={getNoDataMessage(
              filters,
              filtersConfig,
              requestErrorMessage,
              FEATURE_STORE_PAGE,
              FEATURE_SETS_TAB,
              FEATURE_SETS_TAB,
              filtersStore
            )}
          />
        ) : (
          <>
            {(selectedRowData.loading || featureStore.featureSets.featureSetLoading) && <Loader />}
            <Table
              actionsMenu={actionsMenu}
              applyDetailsChanges={applyDetailsChanges}
              applyDetailsChangesCallback={applyDetailsChangesCallback}
              detailsFormInitialValues={detailsFormInitialValues}
              handleCancel={() => setSelectedFeatureSetMin({})}
              pageData={pageData}
              selectedItem={selectedFeatureSet}
              tab={FEATURE_SETS_TAB}
              tableClassName="feature-sets-table"
              tableHeaders={tableContent[0]?.content ?? []}
              virtualizationConfig={virtualizationConfig}
            >
              {tableContent.map(
                (tableItem, index) =>
                  isRowRendered(virtualizationConfig, index) && (
                    <FeatureStoreTableRow
                      actionsMenu={actionsMenu}
                      key={tableItem.data.ui.identifier}
                      pageTab={FEATURE_SETS_TAB}
                      rowIndex={index}
                      rowItem={tableItem}
                      selectedItem={selectedFeatureSet}
                      selectedRowData={selectedRowData}
                      toggleRow={toggleRow}
                      withQuickActions={true}
                    />
                  )
              )}
            </Table>
          </>
        )}
        {featureSetsPanelIsOpen && (
          <FeatureSetsPanel
            closePanel={closePanel}
            createFeatureSetSuccess={createFeatureSetSuccess}
            project={params.projectName}
          />
        )}
      </div>
    )
  }
)

FeatureSetsView.displayName = 'FeatureSetsView'

FeatureSetsView.propTypes = {
  actionsMenu: PropTypes.array.isRequired,
  applyDetailsChanges: PropTypes.func.isRequired,
  applyDetailsChangesCallback: PropTypes.func.isRequired,
  closePanel: PropTypes.func.isRequired,
  createFeatureSetSuccess: PropTypes.func.isRequired,
  detailsFormInitialValues: PropTypes.object.isRequired,
  featureSets: PropTypes.arrayOf(PropTypes.object).isRequired,
  featureSetsPanelIsOpen: PropTypes.bool.isRequired,
  featureStore: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  filtersStore: PropTypes.object.isRequired,
  handleRefresh: PropTypes.func.isRequired,
  pageData: PropTypes.object.isRequired,
  requestErrorMessage: PropTypes.string.isRequired,
  selectedFeatureSet: PropTypes.object.isRequired,
  selectedRowData: PropTypes.object.isRequired,
  setFeatureSetsPanelIsOpen: PropTypes.func.isRequired,
  setSearchParams: PropTypes.func.isRequired,
  setSelectedFeatureSetMin: PropTypes.func.isRequired,
  tableContent: PropTypes.arrayOf(PropTypes.object).isRequired,
  toggleRow: PropTypes.func.isRequired,
  virtualizationConfig: VIRTUALIZATION_CONFIG.isRequired
}

export default FeatureSetsView
