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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { cloneDeep, isEmpty } from 'lodash'

import FeatureVectorsView from './FeatureVectorsView'
import { FeatureStoreContext } from '../FeatureStore'

import {
  FEATURE_STORE_PAGE,
  FEATURE_VECTORS_TAB,
  GROUP_BY_NAME,
  GROUP_BY_NONE,
  REQUEST_CANCELED,
  TAG_FILTER,
  TAG_FILTER_ALL_ITEMS,
  TAG_FILTER_LATEST
} from '../../../constants'
import {
  generateActionsMenu,
  generatePageData,
  searchFeatureVectorItem,
  generateDetailsFormInitialValue
} from './featureVectors.util'
import {
  deleteFeatureVector,
  fetchFeatureVector,
  fetchFeatureVectors,
  fetchFeatureVectorsTags,
  removeFeatureVector,
  removeFeatureVectors
} from '../../../reducers/featureStoreReducer'
import { DANGER_BUTTON, TERTIARY_BUTTON } from 'igz-controls/constants'
import { checkTabIsValid, handleApplyDetailsChanges } from '../featureStore.util'
import { createFeatureVectorsRowData } from '../../../utils/createFeatureStoreContent'
import { filtersConfig } from './featureVectors.util'
import { getFeatureVectorIdentifier } from '../../../utils/getUniqueIdentifier'
import { getFilterTagOptions, setFilters } from '../../../reducers/filtersReducer'
import { getScssVariableValue } from 'igz-controls/utils/common.util'
import { isDetailsTabExists } from '../../../utils/link-helper.util'
import { parseFeatureVectors } from '../../../utils/parseFeatureVectors'
import { setFeaturesPanelData } from '../../../reducers/tableReducer'
import { setNotification } from 'igz-controls/reducers/notificationReducer'
import { showErrorNotification } from 'igz-controls/utils/notification.util'
import { sortListByDate } from 'igz-controls/utils/datetime.util'
import { useFiltersFromSearchParams } from '../../../hooks/useFiltersFromSearchParams.hook'
import { useGroupContent } from '../../../hooks/groupContent.hook'
import { useInitialTableFetch } from '../../../hooks/useInitialTableFetch.hook'
import { useOpenPanel } from '../../../hooks/openPanel.hook'
import { useVirtualization } from '../../../hooks/useVirtualization.hook'

import './featureVectors.scss'

const FeatureVectors = () => {
  const [featureVectors, setFeatureVectors] = useState([])
  const [selectedFeatureVector, setSelectedFeatureVector] = useState({})
  const [selectedRowData, setSelectedRowData] = useState({})
  const [requestErrorMessage, setRequestErrorMessage] = useState('')
  const openPanelByDefault = useOpenPanel()
  const params = useParams()
  const [, setSearchParams] = useSearchParams()
  const featureStore = useSelector(store => store.featureStore)
  const projectStore = useSelector(store => store.projectStore)
  const filtersStore = useSelector(store => store.filtersStore)
  const featureVectorsFilters = useFiltersFromSearchParams(filtersConfig)
  const featureStoreRef = useRef(null)
  const abortControllerRef = useRef(new AbortController())
  const tagAbortControllerRef = useRef(new AbortController())
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const {
    createVectorPopUpIsOpen,
    setCreateVectorPopUpIsOpen,
    setConfirmData,
    toggleConvertedYaml
  } = React.useContext(FeatureStoreContext)
  const frontendSpec = useSelector(store => store.appStore.frontendSpec)

  const featureVectorsRowHeight = useMemo(
    () => getScssVariableValue('--featureVectorsRowHeight'),
    []
  )
  const featureVectorsRowHeightExtended = useMemo(
    () => getScssVariableValue('--featureVectorsRowHeightExtended'),
    []
  )
  const featureVectorsHeaderRowHeight = useMemo(
    () => getScssVariableValue('--featureVectorsHeaderRowHeight'),
    []
  )
  const pageData = useMemo(
    () => generatePageData(selectedFeatureVector),
    [selectedFeatureVector]
  )

  const detailsFormInitialValues = useMemo(
    () => generateDetailsFormInitialValue(selectedFeatureVector, frontendSpec.internal_labels),
    [frontendSpec.internal_labels, selectedFeatureVector]
  )

  const fetchData = useCallback(
    filters => {
      abortControllerRef.current = new AbortController()

      const config = {
        ui: {
          controller: abortControllerRef.current,
          setRequestErrorMessage
        }
      }

      return dispatch(fetchFeatureVectors({ project: params.projectName, filters, config }))
        .unwrap()
        .then(result => {
          if (result) {
            const parsedResult = parseFeatureVectors(result)

            setFeatureVectors(parsedResult)

            return parsedResult
          }
        })
    },
    [dispatch, params.projectName]
  )

  const fetchTags = useCallback(() => {
    tagAbortControllerRef.current = new AbortController()

    return dispatch(
      getFilterTagOptions({
        dispatch,
        fetchTags: fetchFeatureVectorsTags,
        project: params.projectName,
        config: {
          signal: tagAbortControllerRef.current.signal
        }
      })
    )
  }, [dispatch, params.projectName])

  const handleDeleteFeatureVector = useCallback(
    featureVector => {
      dispatch(
        deleteFeatureVector({ project: params.projectName, featureVector: featureVector.name })
      )
        .unwrap()
        .then(() => {
          if (!isEmpty(selectedFeatureVector)) {
            setSelectedFeatureVector({})
            navigate(
              `/projects/${params.projectName}/feature-store/feature-vectors${window.location.search}`,
              {
                replace: true
              }
            )
          }

          dispatch(
            setNotification({
              status: 200,
              id: Math.random(),
              message: 'Feature vector was deleted'
            })
          )

          fetchTags()
            .unwrap()
            .then(response => {
              const tag = [...response, TAG_FILTER_ALL_ITEMS].includes(featureVectorsFilters.tag)
                ? featureVectorsFilters.tag
                : TAG_FILTER_LATEST

              setSearchParams(
                prevSearchParams => {
                  if (tag === filtersConfig[TAG_FILTER].initialValue) {
                    prevSearchParams.delete(TAG_FILTER)
                  } else {
                    prevSearchParams.set(TAG_FILTER, tag)
                  }

                  return prevSearchParams
                },
                { replace: true }
              )

              fetchData({ ...featureVectorsFilters, tag })
            })
        })
        .catch(error => {
          showErrorNotification(dispatch, error, '', 'Failed to delete the feature vector', () =>
            handleDeleteFeatureVector(featureVector)
          )
        })

      setConfirmData(null)
    },
    [
      params.projectName,
      setConfirmData,
      selectedFeatureVector,
      dispatch,
      fetchTags,
      navigate,
      featureVectorsFilters,
      setSearchParams,
      fetchData
    ]
  )

  const onDeleteFeatureVector = useCallback(
    featureVector => {
      setConfirmData({
        item: featureVector,
        header: 'Delete feature vector?',
        message: `Are you sure you want to delete the feature vector "${featureVector.name}"?. You cannot restore a feature vector after deleting it.`,
        btnCancelLabel: 'Cancel',
        btnCancelVariant: TERTIARY_BUTTON,
        btnConfirmLabel: 'Delete',
        btnConfirmVariant: DANGER_BUTTON,
        rejectHandler: () => setConfirmData(null),
        confirmHandler: () => handleDeleteFeatureVector(featureVector)
      })
    },
    [handleDeleteFeatureVector, setConfirmData]
  )

  const actionsMenu = useMemo(
    () => generateActionsMenu(dispatch, onDeleteFeatureVector, toggleConvertedYaml),
    [onDeleteFeatureVector, toggleConvertedYaml, dispatch]
  )

  const handleRefresh = useCallback(
    filters => {
      fetchTags()
      setFeatureVectors([])
      setSelectedFeatureVector({})
      setSelectedRowData({})

      return fetchData(filters)
    },
    [fetchData, fetchTags]
  )

  const collapseRowCallback = useCallback(
    featureVector => {
      const newStoreSelectedRowData = {
        ...featureStore.featureVectors.selectedRowData.content
      }

      const newPageDataSelectedRowData = { ...selectedRowData }

      delete newStoreSelectedRowData[featureVector.data.ui.identifier]
      delete newPageDataSelectedRowData[featureVector.data.ui.identifier]

      dispatch(removeFeatureVector(newStoreSelectedRowData))
      setSelectedRowData(newPageDataSelectedRowData)
    },
    [featureStore.featureVectors.selectedRowData.content, selectedRowData, dispatch]
  )

  const expandRowCallback = useCallback(
    featureVector => {
      const featureVectorIdentifier = getFeatureVectorIdentifier(featureVector)

      setSelectedRowData(state => ({
        ...state,
        [featureVectorIdentifier]: {
          loading: true
        }
      }))

      dispatch(
        fetchFeatureVector({
          project: featureVector.project,
          featureVector: featureVector.name,
          tag: featureVectorsFilters.tag,
          labels: featureVectorsFilters.labels
        })
      )
        .unwrap()
        .then(result => {
          const content = sortListByDate(parseFeatureVectors(result), 'updated', false).map(
            contentItem =>
              createFeatureVectorsRowData(contentItem, FEATURE_VECTORS_TAB, params.projectName)
          )
          setSelectedRowData(state => ({
            ...state,
            [featureVectorIdentifier]: {
              content,
              error: null,
              loading: false
            }
          }))
        })
        .catch(error => {
          setSelectedRowData(state => ({
            ...state,
            [featureVectorIdentifier]: {
              ...state.selectedRowData[featureVectorIdentifier],
              error,
              loading: false
            }
          }))
        })
    },
    [dispatch, featureVectorsFilters.tag, featureVectorsFilters.labels, params.projectName]
  )

  const { latestItems, toggleRow } = useGroupContent(
    featureVectors,
    getFeatureVectorIdentifier,
    collapseRowCallback,
    expandRowCallback,
    null,
    FEATURE_STORE_PAGE,
    FEATURE_VECTORS_TAB
  )

  const tableContent = useMemo(() => {
    return filtersStore.groupBy === GROUP_BY_NAME
      ? sortListByDate(latestItems, 'updated', false).map(contentItem => {
          return createFeatureVectorsRowData(
            contentItem,
            FEATURE_VECTORS_TAB,
            params.projectName,
            true
          )
        })
      : sortListByDate(featureVectors, 'updated', false).map(contentItem =>
          createFeatureVectorsRowData(contentItem, FEATURE_VECTORS_TAB, params.projectName)
        )
  }, [featureVectors, filtersStore.groupBy, latestItems, params.projectName])

  const handleSelectFeatureVector = item => {
    if (params.name === item.name && params.tag === item.tag) {
      setSelectedFeatureVector(item)
    }
  }

  const applyDetailsChanges = useCallback(
    changes => {
      return handleApplyDetailsChanges(
        changes,
        handleRefresh,
        params.projectName,
        params.name,
        FEATURE_VECTORS_TAB,
        selectedFeatureVector,
        setNotification,
        featureVectorsFilters,
        dispatch
      )
    },
    [
      dispatch,
      handleRefresh,
      featureVectorsFilters,
      params.name,
      params.projectName,
      selectedFeatureVector
    ]
  )

  const createFeatureVector = featureVectorData => {
    if (projectStore?.projectsNames?.data?.includes(params.projectName)) {
      setCreateVectorPopUpIsOpen(false)
      dispatch(
        setFeaturesPanelData({
          currentProject: params.projectName,
          featureVector: {
            kind: 'FeatureVector',
            metadata: {
              name: featureVectorData.name,
              project: params.projectName,
              tag: featureVectorData.tag,
              labels: featureVectorData.labels
            },
            spec: {
              description: featureVectorData.description,
              features: [],
              label_feature: ''
            },
            status: {}
          },
          groupedFeatures: {
            [params.projectName]: []
          },
          isNewFeatureVector: true
        })
      )
      navigate(`/projects/${params.projectName}/feature-store/add-to-feature-vector`)
    }
  }

  useEffect(() => {
    setSelectedRowData({})
  }, [featureVectorsFilters.tag])

  useInitialTableFetch({
    fetchData,
    filters: featureVectorsFilters,
    setExpandedRowsData: setSelectedRowData,
    createRowData: rowItem =>
      createFeatureVectorsRowData(rowItem, FEATURE_VECTORS_TAB, params.projectName),
    fetchTags,
    sortExpandedRowsDataBy: 'updated',
    filterModalName: FEATURE_VECTORS_TAB,
    filterName: FEATURE_VECTORS_TAB,
    filtersConfig
  })

  useEffect(() => {
    if (featureVectorsFilters.tag === TAG_FILTER_ALL_ITEMS) {
      dispatch(setFilters({ groupBy: GROUP_BY_NAME }))
    } else if (filtersStore.groupBy === GROUP_BY_NAME) {
      dispatch(setFilters({ groupBy: GROUP_BY_NONE }))
    }
  }, [filtersStore.groupBy, featureVectorsFilters.tag, dispatch])

  useEffect(() => {
    const content = cloneDeep(featureStore.featureVectors?.allData)

    if (params.name && content.length !== 0) {
      const selectedItem = searchFeatureVectorItem(content, params.name, params.tag)

      if (!selectedItem) {
        navigate(
          `/projects/${params.projectName}/feature-store/${FEATURE_VECTORS_TAB}${window.location.search}`,
          {
            replace: true
          }
        )
      } else {
        setSelectedFeatureVector(selectedItem)
      }
    } else {
      setSelectedFeatureVector({})
    }
  }, [featureStore.featureVectors?.allData, navigate, params.name, params.projectName, params.tag])

  useEffect(() => {
    if (params.name && params.tag && pageData.details.menu.length > 0) {
      isDetailsTabExists(params.tab, pageData.details.menu, navigate, location)
    }
  }, [navigate, location, pageData.details.menu, params.name, params.tag, params.tab])

  useEffect(() => {
    checkTabIsValid(navigate, params, setSelectedFeatureVector, FEATURE_VECTORS_TAB)
  }, [navigate, params, setSelectedFeatureVector])

  useEffect(() => {
    if (openPanelByDefault) {
      setCreateVectorPopUpIsOpen(true)
    }
  }, [openPanelByDefault, setCreateVectorPopUpIsOpen])

  useEffect(() => {
    const tagAbortControllerCurrent = tagAbortControllerRef.current

    return () => {
      setFeatureVectors([])
      dispatch(removeFeatureVectors())
      setSelectedFeatureVector({})
      setSelectedRowData({})
      abortControllerRef.current.abort(REQUEST_CANCELED)
      tagAbortControllerCurrent.abort(REQUEST_CANCELED)
      setCreateVectorPopUpIsOpen(false)
    }
  }, [setCreateVectorPopUpIsOpen, params.projectName, tagAbortControllerRef, dispatch])

  const virtualizationConfig = useVirtualization({
    rowsData: {
      content: tableContent,
      expandedRowsData: selectedRowData,
      selectedItem: selectedFeatureVector
    },
    heightData: {
      headerRowHeight: featureVectorsHeaderRowHeight,
      rowHeight: featureVectorsRowHeight,
      rowHeightExtended: featureVectorsRowHeightExtended
    }
  })

  return (
    <FeatureVectorsView
      actionsMenu={actionsMenu}
      applyDetailsChanges={applyDetailsChanges}
      createFeatureVector={createFeatureVector}
      createVectorPopUpIsOpen={createVectorPopUpIsOpen}
      detailsFormInitialValues={detailsFormInitialValues}
      featureStore={featureStore}
      featureVectors={featureVectors}
      filters={featureVectorsFilters}
      filtersStore={filtersStore}
      handleRefresh={handleRefresh}
      pageData={pageData}
      ref={{ featureStoreRef }}
      requestErrorMessage={requestErrorMessage}
      selectedFeatureVector={selectedFeatureVector}
      selectedRowData={selectedRowData}
      setCreateVectorPopUpIsOpen={setCreateVectorPopUpIsOpen}
      setSearchParams={setSearchParams}
      setSelectedFeatureVector={handleSelectFeatureVector}
      tableContent={tableContent}
      toggleRow={toggleRow}
      virtualizationConfig={virtualizationConfig}
    />
  )
}

export default FeatureVectors
