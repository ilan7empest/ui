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
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty } from 'lodash'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import FunctionsViewOld from './FunctionsViewOld'
import JobWizard from '../JobWizard/JobWizard'
import NewFunctionPopUp from '../../elements/NewFunctionPopUp/NewFunctionPopUp'

import {
  FUNCTIONS_PAGE,
  GROUP_BY_NAME,
  TAG_LATEST,
  REQUEST_CANCELED,
  DETAILS_BUILD_LOG_TAB,
  JOB_DEFAULT_OUTPUT_PATH,
  DATES_FILTER,
  NAME_FILTER,
  SHOW_UNTAGGED_FILTER
} from '../../constants'
import {
  checkForSelectedFunction,
  generateActionsMenu,
  generateFunctionsPageData,
  pollDeletingFunctions,
  searchFunctionItem,
  setFullSelectedFunction
} from './functionsOld.util'
import {
  datePickerPastOptions,
  getDatePickerFilterValue,
  PAST_WEEK_DATE_OPTION
} from '../../utils/datePicker.util'
import {
  deleteFunction,
  deployFunction,
  fetchFunction,
  fetchFunctions,
  removeFunctionsError,
  removeNewFunction
} from '../../reducers/functionReducer'
import createFunctionsRowData from '../../utils/createFunctionsRowData'
import { DANGER_BUTTON, TERTIARY_BUTTON } from 'igz-controls/constants'
import { getFunctionIdentifier } from '../../utils/getUniqueIdentifier'
import { isBackgroundTaskRunning } from '../../utils/poll.util'
import { isDetailsTabExists } from '../../utils/link-helper.util'
import { openPopUp, getScssVariableValue } from 'igz-controls/utils/common.util'
import { parseFunctions } from '../../utils/parseFunctions'
import { runNewJob } from '../../reducers/jobReducer'
import { setFilters } from '../../reducers/filtersReducer'
import { setNotification } from 'igz-controls/reducers/notificationReducer'
import { showErrorNotification } from 'igz-controls/utils/notification.util'
import { toggleYaml } from '../../reducers/appReducer'
import { useFiltersFromSearchParams } from '../../hooks/useFiltersFromSearchParams.hook'
import { useGroupContent } from '../../hooks/groupContent.hook'
import { useInitialTableFetch } from '../../hooks/useInitialTableFetch.hook'
import { useMode } from '../../hooks/mode.hook'
import { useVirtualization } from '../../hooks/useVirtualization.hook'

import '../FunctionsPage/functions.scss'

const Functions = () => {
  const [confirmData, setConfirmData] = useState(null)
  const [functions, setFunctions] = useState([])
  const [selectedFunctionMin, setSelectedFunctionMin] = useState({})
  const [selectedFunction, setSelectedFunction] = useState({})
  const [editableItem, setEditableItem] = useState(null)
  const [functionsPanelIsOpen, setFunctionsPanelIsOpen] = useState(false)
  const [jobWizardIsOpened, setJobWizardIsOpened] = useState(false)
  const [jobWizardMode, setJobWizardMode] = useState(null)
  const filtersStore = useSelector(store => store.filtersStore)
  const [expandedRowsData, setExpandedRowsData] = useState({})
  const [requestErrorMessage, setRequestErrorMessage] = useState('')
  const [deletingFunctions, setDeletingFunctions] = useState({})
  const abortControllerRef = useRef(new AbortController())
  const fetchFunctionLogsTimeout = useRef(null)
  const fetchFunctionNuclioLogsTimeout = useRef(null)
  const terminatePollRef = useRef(null)
  const { isDemoMode, isStagingMode } = useMode()
  const params = useParams()
  const [, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const functionsStore = useSelector(store => store.functionsStore)

  const functionsRowHeight = useMemo(() => getScssVariableValue('--functionsRowHeight'), [])
  const functionsRowHeightExtended = useMemo(
    () => getScssVariableValue('--functionsRowHeightExtended'),
    []
  )
  const functionsHeaderRowHeight = useMemo(
    () => getScssVariableValue('--functionsHeaderRowHeight'),
    []
  )
  const functionsFiltersConfig = useMemo(() => {
    return {
      [NAME_FILTER]: { label: 'Name:', initialValue: '' },
      [DATES_FILTER]: {
        label: 'Updated:',
        initialValue: getDatePickerFilterValue(datePickerPastOptions, PAST_WEEK_DATE_OPTION)
      },
      [SHOW_UNTAGGED_FILTER]: { label: 'Show untagged:', initialValue: false, isModal: true }
    }
  }, [])

  const functionsFilters = useFiltersFromSearchParams(functionsFiltersConfig)

  const terminateDeleteTasksPolling = useCallback(() => {
    terminatePollRef?.current?.()
    setDeletingFunctions({})
  }, [])

  const fetchData = useCallback(
    (filters, filtersAreHandled = false) => {
      terminateDeleteTasksPolling()
      abortControllerRef.current = new AbortController()
      setFunctions([])

      return dispatch(
        fetchFunctions({
          project: params.projectName,
          filters,
          config: {
            ui: {
              controller: abortControllerRef.current,
              setRequestErrorMessage
            },
            params: {
              format: 'minimal'
            }
          }
        })
      )
        .unwrap()
        .then(response => {
          if (response?.funcs?.length > 0) {
            const newFunctions = parseFunctions(response?.funcs, params.projectName)
            const deletingFunctions = newFunctions.reduce((acc, func) => {
              if (func.deletion_task_id && !func.deletion_error && !acc[func.deletion_task_id]) {
                acc[func.deletion_task_id] = {
                  name: func.name
                }
              }

              return acc
            }, {})

            if (!isEmpty(deletingFunctions)) {
              setDeletingFunctions(deletingFunctions)
              pollDeletingFunctions(
                params.projectName,
                terminatePollRef,
                deletingFunctions,
                () => fetchData(filters),
                dispatch
              )
            }

            setFunctions(newFunctions)

            return newFunctions
          } else if (!filtersAreHandled) {
            const paramsFunction = searchFunctionItem(
              params.hash,
              params.funcName,
              params.tag,
              params.projectName,
              [],
              dispatch,
              true
            )

            if (!paramsFunction) {
              navigate(`/projects/${params.projectName}/functions${window.location.search}`, {
                replace: true
              })
            }
          }
        }).catch(() => {
          setFunctions([])
        })
    },
    [
      dispatch,
      navigate,
      params.funcName,
      params.hash,
      params.projectName,
      params.tag,
      terminateDeleteTasksPolling
    ]
  )

  const refreshFunctions = useCallback(
      (filters, filtersAreHandled) => {
      setFunctions([])
      setSelectedFunctionMin({})
      setExpandedRowsData({})

      return fetchData(filters, filtersAreHandled)
    },
    [fetchData]
  )

  const handleExpand = useCallback(
    (func, content) => {
      const funcIdentifier = getFunctionIdentifier(func)

      setExpandedRowsData(state => {
        return {
          ...state,
          [funcIdentifier]: {
            content: content[funcIdentifier].map(contentItem =>
              createFunctionsRowData(contentItem, params.projectName, false, false, true)
            )
          }
        }
      })
    },
    [params.projectName]
  )

  const handleCollapse = useCallback(
    func => {
      const funcIdentifier = getFunctionIdentifier(func.data)
      const newPageDataSelectedRowData = { ...expandedRowsData }

      delete newPageDataSelectedRowData[funcIdentifier]

      setExpandedRowsData(newPageDataSelectedRowData)
    },
    [expandedRowsData]
  )

  const handleExpandAllCallback = useCallback(
    (collapse, content) => {
      const newSelectedRowData = {}
      if (collapse) {
        setExpandedRowsData({})
      } else {
        Object.entries(content).forEach(([key, value]) => {
          newSelectedRowData[key] = {
            content: value.map(contentItem =>
              createFunctionsRowData(contentItem, params.projectName, false, false, true)
            )
          }
        })
      }

      setExpandedRowsData(newSelectedRowData)
    },
    [params.projectName]
  )

  const { latestItems, allRowsAreExpanded, toggleRow, toggleAllRows } = useGroupContent(
    functions,
    getFunctionIdentifier,
    handleCollapse,
    handleExpand,
    null,
    FUNCTIONS_PAGE,
    null,
    handleExpandAllCallback
  )

  const tableContent = useMemo(
    () =>
      latestItems.map(contentItem =>
        createFunctionsRowData(contentItem, params.projectName, false, true, true)
      ),
    [latestItems, params.projectName]
  )

  const removeFunction = useCallback(
    func => {
      dispatch(deleteFunction({ funcName: func.name, project: params.projectName }))
        .unwrap()
        .then(response => {
          if (isBackgroundTaskRunning(response)) {
            dispatch(
              setNotification({
                status: 200,
                id: Math.random(),
                message: 'Function deletion in progress'
              })
            )

            setDeletingFunctions(prevDeletingFunctions => {
              const newDeletingFunctions = {
                ...prevDeletingFunctions,
                [response.data.metadata.name]: {
                  name: func.name
                }
              }

              pollDeletingFunctions(
                params.projectName,
                terminatePollRef,
                newDeletingFunctions,
                () => fetchData(functionsFilters),
                dispatch
              )

              return newDeletingFunctions
            })

            if (!isEmpty(selectedFunction)) {
              setSelectedFunctionMin({})
              navigate(`/projects/${params.projectName}/functions${window.location.search}`, {
                replace: true
              })
            }
          }
        })

      setConfirmData(null)
    },
    [dispatch, fetchData, functionsFilters, navigate, params.projectName, selectedFunction]
  )

  const toggleConvertedYaml = useCallback(
    data => {
      return dispatch(toggleYaml(data))
    },
    [dispatch]
  )

  const onRemoveFunction = useCallback(
    func => {
      setConfirmData({
        item: func,
        header: 'Delete function?',
        message: `You try to delete function "${func.name}". Deleted functions cannot be restored.`,
        btnCancelLabel: 'Cancel',
        btnCancelVariant: TERTIARY_BUTTON,
        btnConfirmLabel: 'Delete',
        btnConfirmVariant: DANGER_BUTTON,
        rejectHandler: () => setConfirmData(null),
        confirmHandler: () => removeFunction(func)
      })
    },
    [removeFunction]
  )

  const buildAndRunFunc = useCallback(
    func => {
      const data = {
        function: {
          kind: func.type,
          metadata: {
            credentials: {
              access_key: func.access_key
            },
            labels: func.labels,
            name: func.name,
            project: func.project,
            tag: func.tag
          },
          spec: {
            args: func.args,
            base_spec: func.base_spec,
            build: func.build,
            command: func.command,
            default_class: func.default_class,
            default_handler: func.default_handler,
            description: func.description,
            disable_auto_mount: func.disable_auto_mount,
            env: func.env,
            error_stream: func.error_stream,
            graph: func.graph,
            image: func.image,
            parameters: func.parameters,
            preemption_mode: func.preemption_mode,
            priority_class_name: func.priority_class_name,
            resources: func.resources,
            secret_sources: func.secret_sources,
            track_models: func.track_models,
            volume_mounts: func.volume_mounts,
            volumes: func.volumes
          }
        }
      }

      dispatch(deployFunction({ data }))
        .unwrap()
        .then(result => {
          const data = result.data.data
          const postData = {
            function: {
              metadata: {
                credentials: {
                  access_key: data.metadata.credentials.access_key
                }
              },
              spec: {
                build: data.spec.build,
                env: data.spec.env,
                image: data.spec.image,
                node_selector: data.spec.node_selector,
                preemption_mode: data.spec.preemption_mode,
                priority_class_name: data.spec.priority_class_name,
                resources: data.spec.resources,
                volume_mounts: data.spec.volume_mounts,
                volumes: data.spec.volumes
              }
            },
            task: {
              metadata: {
                labels: data.metadata.labels,
                name: data.metadata.name,
                project: data.metadata.project
              },
              spec: {
                function: `${func.project}/${func.name}@${func.hash}`,
                handler: data.spec.default_handler,
                input_path: '',
                inputs: {},
                output_path: JOB_DEFAULT_OUTPUT_PATH,
                parameters: {}
              }
            }
          }

          return dispatch(runNewJob({ postData }))
        })
        .unwrap()
        .then(() => {
          dispatch(
            setNotification({
              status: 200,
              id: Math.random(),
              message: 'Function is built and ran successfully.'
            })
          )
          refreshFunctions(functionsFilters)
        })
        .catch(error => {
          showErrorNotification(dispatch, error, 'Failed to build and run function.', '', () => {
            buildAndRunFunc(func)
          })
        })
    },
    [dispatch, functionsFilters, refreshFunctions]
  )

  const pageData = useMemo(
    () =>
      generateFunctionsPageData(
        dispatch,
        selectedFunction,
        fetchFunctionLogsTimeout,
        fetchFunctionNuclioLogsTimeout,
        navigate,
        fetchData,
        filtersStore
      ),
    [dispatch, fetchData, filtersStore, navigate, selectedFunction]
  )

  const actionsMenu = useMemo(
    () => func =>
      generateActionsMenu(
        dispatch,
        func,
        isDemoMode,
        isStagingMode,
        setJobWizardMode,
        setFunctionsPanelIsOpen,
        setEditableItem,
        onRemoveFunction,
        toggleConvertedYaml,
        buildAndRunFunc,
        deletingFunctions,
        selectedFunction,
        fetchFunction
      ),
    [
      dispatch,
      isDemoMode,
      isStagingMode,
      onRemoveFunction,
      toggleConvertedYaml,
      buildAndRunFunc,
      deletingFunctions,
      selectedFunction
    ]
  )

  useEffect(() => {
    setFullSelectedFunction(
      dispatch,
      navigate,
      fetchFunction,
      selectedFunctionMin,
      setSelectedFunction,
      params.projectName
    )
  }, [dispatch, navigate, params.projectName, selectedFunctionMin])

  useInitialTableFetch({
    fetchData,
    createRowData: rowItem =>
      createFunctionsRowData(rowItem, params.projectName, false, false, true),
    filters: functionsFilters
  })

  useEffect(() => {
    const abortController = abortControllerRef.current

    return () => {
      setSelectedFunctionMin({})
      setFunctions([])
      setExpandedRowsData({})
      abortController.abort(REQUEST_CANCELED)
    }
  }, [params.projectName])

  useEffect(() => {
    if ((params.funcName || params.hash) && pageData.details.menu.length > 0) {
      isDetailsTabExists(params.tab, pageData.details.menu, navigate, location)
    }
  }, [navigate, pageData.details.menu, location, params.hash, params.funcName, params.tab])

  useEffect(() => {
    checkForSelectedFunction(
      params.funcName,
      expandedRowsData,
      functions,
      params.hash,
      params.tag,
      navigate,
      params.projectName,
      setSelectedFunctionMin,
      dispatch
    )
  }, [
    dispatch,
    functions,
    navigate,
    params.funcName,
    params.hash,
    params.projectName,
    params.tag,
    expandedRowsData
  ])

  useEffect(() => {
    dispatch(setFilters({ groupBy: GROUP_BY_NAME }))
  }, [dispatch, params.projectName])

  const filtersChangeCallback = filters => {
    refreshFunctions(filters, true)
  }

  const handleSelectFunction = () => {
    if (document.getElementsByClassName('view')[0]) {
      document.getElementsByClassName('view')[0].classList.remove('view')
    }
  }

  const closePanel = () => {
    setFunctionsPanelIsOpen(false)
    setEditableItem(null)
    dispatch(removeNewFunction())

    if (functionsStore.error) {
      dispatch(removeFunctionsError())
    }
  }

  const createFunctionSuccess = isEditMode => {
    setEditableItem(null)
    setFunctionsPanelIsOpen(false)
    dispatch(removeNewFunction())

    return fetchData().then(() => {
      dispatch(
        setNotification({
          status: 200,
          id: Math.random(),
          message: isEditMode ? 'Function edited successfully' : 'Function created successfully'
        })
      )
    })
  }

  const handleDeployFunctionSuccess = ready => {
    let { name, tag } = functionsStore.newFunction.metadata
    const tab = ready === false ? DETAILS_BUILD_LOG_TAB : 'overview'

    tag ||= TAG_LATEST

    setFunctionsPanelIsOpen(false)
    setEditableItem(null)
    dispatch(removeNewFunction())

    return fetchData(functionsFilters).then(functions => {
      if (functions.length) {
        const currentItem = functions.find(func => func.name === name && func.tag === tag)

        if (currentItem) {
          navigate(
            `/projects/${params.projectName}/functions/${currentItem.hash}/${tab}${window.location.search}`
          )
        }

        dispatch(
          setNotification({
            status: 200,
            id: Math.random(),
            message: 'Function was deployed'
          })
        )
      }
    })
  }

  const handleDeployFunctionFailure = error => {
    const { name, tag } = functionsStore.newFunction.metadata

    setFunctionsPanelIsOpen(false)
    dispatch(removeNewFunction())

    return fetchData().then(functions => {
      if (functions) {
        const currentItem = functions.find(func => func.name === name && func.tag === tag)

        showErrorNotification(dispatch, error, '', 'Failed to deploy the function')

        if (currentItem) {
          navigate(
            `/projects/${params.projectName}/functions/${currentItem.hash}/overview${window.location.search}`
          )
        }
      }
    })
  }

  const getPopUpTemplate = useCallback(
    action => {
      return (
        <NewFunctionPopUp
          key={action}
          action={action}
          currentProject={params.projectName}
          isCustomPosition
          setFunctionsPanelIsOpen={setFunctionsPanelIsOpen}
        />
      )
    },
    [params.projectName]
  )

  const handleCancel = () => {
    setSelectedFunctionMin({})
  }

  useEffect(() => {
    if (!jobWizardIsOpened && jobWizardMode) {
      openPopUp(JobWizard, {
        params,
        onWizardClose: () => {
          setJobWizardMode(null)
          setJobWizardIsOpened(false)
        },
        mode: jobWizardMode
      })

      setJobWizardIsOpened(true)
    }
  }, [editableItem, jobWizardIsOpened, jobWizardMode, params])

  const virtualizationConfig = useVirtualization({
    rowsData: {
      content: tableContent,
      expandedRowsData,
      selectedItem: selectedFunction
    },
    heightData: {
      headerRowHeight: functionsHeaderRowHeight,
      rowHeight: functionsRowHeight,
      rowHeightExtended: functionsRowHeightExtended
    },
    activateTableScroll: true
  })

  return (
    <FunctionsViewOld
      actionsMenu={actionsMenu}
      allRowsAreExpanded={allRowsAreExpanded}
      closePanel={closePanel}
      confirmData={confirmData}
      createFunctionSuccess={createFunctionSuccess}
      editableItem={editableItem}
      expandedRowsData={expandedRowsData}
      filters={functionsFilters}
      filtersChangeCallback={filtersChangeCallback}
      filtersStore={filtersStore}
      functions={functions}
      functionsFiltersConfig={functionsFiltersConfig}
      functionsPanelIsOpen={functionsPanelIsOpen}
      functionsStore={functionsStore}
      getPopUpTemplate={getPopUpTemplate}
      handleCancel={handleCancel}
      handleDeployFunctionFailure={handleDeployFunctionFailure}
      handleDeployFunctionSuccess={handleDeployFunctionSuccess}
      handleSelectFunction={handleSelectFunction}
      isDemoMode={isDemoMode}
      pageData={pageData}
      requestErrorMessage={requestErrorMessage}
      selectedFunction={selectedFunction}
      setSearchParams={setSearchParams}
      tableContent={tableContent}
      toggleAllRows={toggleAllRows}
      toggleRow={toggleRow}
      virtualizationConfig={virtualizationConfig}
    />
  )
}

export default React.memo(Functions)
