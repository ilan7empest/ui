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
import React, { useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Tooltip, TextTooltipTemplate, RoundedIcon } from 'igz-controls/components'
import LoadButton from '../../../common/LoadButton/LoadButton'
import Select from '../../../common/Select/Select'
import ActionsMenu from '../../../common/ActionsMenu/ActionsMenu'

import {
  DETAILS_ARTIFACTS_TAB,
  FULL_VIEW_MODE,
  JOBS_PAGE,
  VIEW_SEARCH_PARAMETER
} from '../../../constants'
import { formatDatetime } from '../../../utils'
import { TERTIARY_BUTTON } from 'igz-controls/constants'
import { ACTIONS_MENU } from '../../../types'
import { getViewMode } from '../../../utils/helper'
import {
  generateUrlFromRouterPath,
  getDefaultCloseDetailsLink
} from '../../../utils/link-helper.util'
import { getFilteredSearchParams } from '../../../utils/filter.util'
import { setIteration } from '../../../reducers/detailsReducer'

import Close from 'igz-controls/images/close.svg?react'
import Back from 'igz-controls/images/back-arrow.svg?react'
import Refresh from 'igz-controls/images/refresh.svg?react'
import EnlargeIcon from 'igz-controls/images/ml-enlarge.svg?react'
import MinimizeIcon from 'igz-controls/images/ml-minimize.svg?react'
import HistoryIcon from 'igz-controls/images/history.svg?react'
import InfoIcon from 'igz-controls/images/info-fill.svg?react'

const DetailsHeader = ({
  actionsMenu,
  applyChanges,
  applyChangesRef,
  cancelChanges,
  getCloseDetailsLink = null,
  handleCancel = null,
  handleRefresh,
  handleShowWarning,
  isDetailsScreen,
  isDetailsPopUp = false,
  pageData,
  selectedItem,
  tab,
  withActionMenu = true
}) => {
  const detailsStore = useSelector(store => store.detailsStore)
  const params = useParams()
  const navigate = useNavigate()
  const viewMode = getViewMode(window.location.search)
  const { actionButton, withToggleViewBtn, showAllVersions } = pageData.details
  const headerRef = useRef()
  const location = useLocation()
  const dispatch = useDispatch()

  const errorMessage = useMemo(
    () =>
      selectedItem.reason
        ? `Reason: ${selectedItem.reason}`
        : selectedItem.error
          ? `Error: ${selectedItem.error}`
          : '',
    [selectedItem.error, selectedItem.reason]
  )

  const podsData = useMemo(() => {
    return isDetailsPopUp ? detailsStore.detailsJobPods : detailsStore.pods
  }, [detailsStore.detailsJobPods, detailsStore.pods, isDetailsPopUp])

  const {
    value: stateValue,
    label: stateLabel,
    className: stateClassName
  } = selectedItem.state || {}

  const handleBackClick = useCallback(() => {
    if (detailsStore.changes.counter > 0) {
      handleShowWarning(true)
    } else {
      handleCancel()
    }
  }, [detailsStore.changes.counter, handleCancel, handleShowWarning])

  const handleCancelClick = useCallback(() => {
    if (detailsStore.changes.counter === 0 || isDetailsPopUp) {
      handleCancel()
    }
  }, [detailsStore.changes.counter, handleCancel, isDetailsPopUp])

  return (
    <div className="item-header" ref={headerRef}>
      <div className="item-header__data">
        <h3 className="item-header__title">
          {isDetailsScreen && !pageData.details.hideBackBtn && !isDetailsPopUp && (
            <Link
              className="item-header__back-btn"
              to={
                getCloseDetailsLink
                  ? getCloseDetailsLink(selectedItem.name)
                  : generateUrlFromRouterPath(
                      window.location.pathname.split('/').slice(0, -2).join('/') +
                        window.location.search
                    )
              }
              onClick={handleBackClick}
            >
              <RoundedIcon id="go-back" tooltipText="Go to list">
                <Back />
              </RoundedIcon>
            </Link>
          )}
          <Tooltip
            template={<TextTooltipTemplate text={selectedItem.name || selectedItem.db_key} />}
          >
            {selectedItem.name || selectedItem.db_key}
          </Tooltip>
        </h3>
        <div className="item-header__status">
          {/*In the Workflow page we display both Jobs and Functions items. The function contains `updated` property.
            The job contains startTime property.*/}
          <div className="item-header__status-row">
            <span className="updated data-ellipsis">
              {Object.keys(selectedItem).length > 0 &&
              pageData.page === JOBS_PAGE &&
              !selectedItem?.updated
                ? formatDatetime(
                    selectedItem?.startTime,
                    stateValue === 'aborted' ? 'N/A' : 'Not yet started'
                  )
                : selectedItem?.updated
                  ? formatDatetime(selectedItem?.updated, 'N/A')
                  : pageData.details.additionalHeaderInfo || ''}
            </span>
            {stateValue && stateLabel && (
              <Tooltip className="state" template={<TextTooltipTemplate text={stateLabel} />}>
                <i className={stateClassName} />
              </Tooltip>
            )}
          </div>
          <div className="item-header__status-row">
            {selectedItem.ui?.customError?.title && selectedItem.ui?.customError?.message && (
              <Tooltip
                className="error-container"
                template={
                  <TextTooltipTemplate
                    text={`${selectedItem.ui.customError.title} ${selectedItem.ui.customError.message}`}
                  />
                }
              >
                {selectedItem.ui.customError.title} {selectedItem.ui.customError.message}
              </Tooltip>
            )}
            {errorMessage && (
              <Tooltip
                className="error-container"
                template={<TextTooltipTemplate text={errorMessage} />}
              >
                {errorMessage}
              </Tooltip>
            )}
            {!isEmpty(podsData?.podsPending) && (
              <span className="left-margin">
                {`${podsData.podsPending.length} of ${podsData.podsList.length} pods are pending`}
              </span>
            )}
            {detailsStore.pods.error && (
              <span className="item-header__pods-error left-margin">Failed to load pods</span>
            )}
          </div>
          {selectedItem.ui?.infoMessage && (
            <div className="item-header__status-row">
              <div className="info-banner">
                <InfoIcon />
                <Tooltip
                  className="error-container"
                  template={<TextTooltipTemplate text={selectedItem.ui.infoMessage} />}
                >
                  {selectedItem.ui.infoMessage}
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="item-header__custom-elements">
        {params.tab === DETAILS_ARTIFACTS_TAB && detailsStore.iteration && !isDetailsPopUp && (
          <Select
            density="dense"
            key="Iteration"
            label="Iteration:"
            onClick={option => {
              dispatch(setIteration(option))
            }}
            options={detailsStore.iterationOptions}
            selectedId={detailsStore.iteration}
          />
        )}
      </div>
      <div className="item-header__buttons">
        {detailsStore.changes.counter > 0 && !isDetailsPopUp && (
          <>
            <Button
              variant={TERTIARY_BUTTON}
              label="Cancel"
              onClick={cancelChanges}
              disabled={detailsStore.changes.counter === 0 || detailsStore.editMode}
            />
            <Tooltip
              template={
                <TextTooltipTemplate
                  text={`${detailsStore.changes.counter} ${
                    detailsStore.changes.counter === 1 ? 'change pending' : 'changes pending'
                  }`}
                />
              }
            >
              <LoadButton
                ref={applyChangesRef}
                variant="primary"
                label="Apply Changes"
                className="btn_apply-changes"
                onClick={applyChanges}
                disabled={detailsStore.changes.counter === 0 || detailsStore.editMode}
              />
            </Tooltip>
          </>
        )}
        {actionButton && !actionButton.hidden && (
          <Button
            disabled={actionButton.disabled}
            label={actionButton.label}
            onClick={actionButton.onClick}
            tooltip={actionButton.tooltip}
            variant={actionButton.variant}
          />
        )}
        {showAllVersions && (
          <RoundedIcon
            id="showAllVersions"
            onClick={() => showAllVersions()}
            tooltipText="Show all versions"
          >
            <HistoryIcon />
          </RoundedIcon>
        )}
        {isDetailsScreen && (
          <RoundedIcon
            id="refresh"
            onClick={() => handleRefresh(selectedItem)}
            tooltipText="Refresh"
          >
            <Refresh />
          </RoundedIcon>
        )}
        {withActionMenu && <ActionsMenu dataItem={selectedItem} menu={actionsMenu} time={500} />}
        <div className="item-header__navigation-buttons">
          {withToggleViewBtn && !isDetailsPopUp && (
            <>
              {viewMode !== FULL_VIEW_MODE && (
                <RoundedIcon
                  onClick={() => {
                    navigate(
                      `${location.pathname}${window.location.search}${window.location.search ? '&' : '?'}${VIEW_SEARCH_PARAMETER}=full`
                    )
                  }}
                  id="full-view"
                  tooltipText="Full view"
                >
                  <EnlargeIcon />
                </RoundedIcon>
              )}
              {viewMode === FULL_VIEW_MODE && (
                <RoundedIcon
                  onClick={() => {
                    navigate(
                      `${location.pathname}${getFilteredSearchParams(window.location.search, [VIEW_SEARCH_PARAMETER])}`
                    )
                  }}
                  id="table-view"
                  tooltipText="Table view"
                >
                  <MinimizeIcon />
                </RoundedIcon>
              )}
            </>
          )}
          {!pageData.details.hideBackBtn &&
            (isDetailsPopUp ? (
              <div
                className="details-close-btn"
                data-testid="details-close-btn"
                onClick={handleCancelClick}
              >
                <RoundedIcon tooltipText="Close" id="details-close">
                  <Close />
                </RoundedIcon>
              </div>
            ) : (
              <Link
                className="details-close-btn"
                data-testid="details-close-btn"
                to={
                  getCloseDetailsLink
                    ? getCloseDetailsLink(selectedItem.name)
                    : getDefaultCloseDetailsLink(params, pageData.page, tab)
                }
                onClick={handleCancelClick}
              >
                <RoundedIcon tooltipText="Close" id="details-close">
                  <Close />
                </RoundedIcon>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}

DetailsHeader.propTypes = {
  actionsMenu: ACTIONS_MENU.isRequired,
  applyChanges: PropTypes.func.isRequired,
  applyChangesRef: PropTypes.object.isRequired,
  cancelChanges: PropTypes.func.isRequired,
  getCloseDetailsLink: PropTypes.func,
  handleCancel: PropTypes.func,
  handleRefresh: PropTypes.func,
  handleShowWarning: PropTypes.func.isRequired,
  isDetailsPopUp: PropTypes.bool,
  isDetailsScreen: PropTypes.bool.isRequired,
  pageData: PropTypes.object.isRequired,
  selectedItem: PropTypes.object.isRequired,
  tab: PropTypes.string,
  withActionMenu: PropTypes.bool
}

export default React.memo(DetailsHeader)
