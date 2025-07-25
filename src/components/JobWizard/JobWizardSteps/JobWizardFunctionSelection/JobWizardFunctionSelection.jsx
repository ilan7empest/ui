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
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { includes, isEmpty, intersection, isBoolean, pickBy, keys, uniqBy, cloneDeep } from 'lodash'

import ContentMenu from '../../../../elements/ContentMenu/ContentMenu'
import FilterMenuModal from '../../../FilterMenuModal/FilterMenuModal'
import FunctionCardTemplate from '../../../../elements/FunctionCardTemplate/FunctionCardTemplate'
import HubCategoriesFilter from '../../../FilterMenuModal/HubCategoriesFilter/HubCategoriesFilter'
import NoData from '../../../../common/NoData/NoData'
import Search from '../../../../common/Search/Search'
import { FormOnChange, FormSelect } from 'igz-controls/components'

import {
  FILTER_MENU_MODAL,
  FUNCTION_RUN_KINDS,
  FUNCTION_SELECTION_STEP,
  HUB_CATEGORIES_FILTER,
  JOB_WIZARD_FILTERS,
  TAG_LATEST
} from '../../../../constants'
import { generateJobWizardData, getCategoryName } from '../../JobWizard.util'
import { generateProjectsList } from '../../../../utils/projects'
import { openConfirmPopUp } from 'igz-controls/utils/common.util'
import { scrollToElement } from '../../../../utils/scroll.util'
import {
  FUNCTIONS_SELECTION_FUNCTIONS_TAB,
  FUNCTIONS_SELECTION_HUB_TAB,
  functionsSelectionTabs,
  generateFunctionCardData,
  generateFunctionTemplateCardData
} from './jobWizardFunctionSelection.util'
import {
  fetchFunctions,
  fetchFunctionTemplate,
  fetchHubFunctions
} from '../../../../reducers/functionReducer'

import './jobWizardFunctionSelection.scss'
import { fetchProjectsNames } from '../../../../reducers/projectReducer'

const JobWizardFunctionSelection = ({
  activeTab,
  currentProject = null,
  defaultData,
  filteredFunctions,
  filteredTemplates,
  formState,
  frontendSpec,
  functions,
  isEditMode,
  isTrain,
  params,
  selectedFunctionData,
  selectedFunctionTab,
  setActiveTab,
  setFilteredFunctions,
  setFilteredTemplates,
  setFunctions,
  setJobAdditionalData,
  setSelectedFunctionData,
  setSelectedFunctionTab,
  setShowSchedule,
  setTemplates,
  setTemplatesCategories,
  stepIsActive = false,
  templates,
  templatesCategories
}) => {
  const projectNames = useSelector(store => store.projectStore.projectsNames.data)

  const [hubFiltersInitialValues] = useState({ [HUB_CATEGORIES_FILTER]: {} })
  const [filterByName, setFilterByName] = useState('')
  const [filterMatches, setFilterMatches] = useState([])
  const [projects, setProjects] = useState(generateProjectsList(projectNames, params.projectName))
  const [functionsRequestErrorMessage, setFunctionsRequestErrorMessage] = useState('')
  const [hubFunctionsRequestErrorMessage, setHubFunctionsRequestErrorMessage] = useState('')
  const selectedActiveTab = useRef(null)
  const functionsContainerRef = useRef(null)
  const hubFunctionLoadedRef = useRef(false)

  const jobWizardFiltersValues = useSelector(
    store =>
      store.filtersStore[FILTER_MENU_MODAL]?.[JOB_WIZARD_FILTERS]?.values ?? hubFiltersInitialValues
  )
  const { loading } = useSelector(store => store.functionsStore)

  const filtersStoreHubCategories = useMemo(
    () => jobWizardFiltersValues[HUB_CATEGORIES_FILTER],
    [jobWizardFiltersValues]
  )

  const dispatch = useDispatch()

  const filterTemplates = useMemo(() => {
    return templatesCategories.map(categoryId => {
      const categoryName = getCategoryName(categoryId)

      return {
        id: categoryId,
        label: categoryName
      }
    })
  }, [templatesCategories])

  const getFilteredTemplates = useCallback(
    (templates, filteredByCategory) => {
      const filteredArray = templates.filter(template => {
        const hubCategoriesArray = keys(pickBy(filtersStoreHubCategories, isBoolean))
        const validName = template.metadata.name.includes(filterByName)
        const validCategory = filteredByCategory
          ? !isEmpty(intersection(hubCategoriesArray, template.ui?.categories))
          : true

        return validName && validCategory && template.metadata.tag === TAG_LATEST
      })

      return uniqBy(filteredArray, 'metadata.name')
    },
    [filterByName, filtersStoreHubCategories]
  )

  useEffect(() => {
    if (projects.length === 0) {
      dispatch(fetchProjectsNames())
        .unwrap()
        .then(projects => {
          setProjects(generateProjectsList(projects, params.projectName))
        })
        .catch(() => {})
    }
  }, [dispatch, params.projectName, projects.length])

  useEffect(() => {
    const initialValues = formState.initialValues

    if (
      projects.length > 0 &&
      !initialValues?.[FUNCTION_SELECTION_STEP]?.projectName &&
      params?.projectName
    ) {
      formState.form.reset({
        ...initialValues,
        [FUNCTION_SELECTION_STEP]: {
          ...initialValues?.[FUNCTION_SELECTION_STEP],
          projectName: params.projectName
        }
      })
    }
  }, [formState.form, formState.initialValues, params.projectName, projects.length])

  useEffect(() => {
    const filteredByCategory = !isEmpty(filtersStoreHubCategories)

    const filteredTemplates = getFilteredTemplates(templates, filteredByCategory)
    setFilteredTemplates(filteredTemplates)

    if (filterByName.length > 0 || filteredByCategory) {
      const filteredFunctions = functions.filter(func => func.name.includes(filterByName))
      setFilteredFunctions(filteredFunctions)

      const filterMatches =
        activeTab === FUNCTIONS_SELECTION_FUNCTIONS_TAB
          ? filteredFunctions.map(func => func.name)
          : filteredTemplates.map(template => template.metadata.name)

      setFilterMatches([...new Set(filterMatches)])
    }
  }, [
    activeTab,
    filterByName,
    filtersStoreHubCategories,
    functions,
    getFilteredTemplates,
    setFilteredFunctions,
    setFilteredTemplates,
    templates,
    templatesCategories
  ])

  useEffect(() => {
    if (
      filterByName.length === 0 &&
      isEmpty(filtersStoreHubCategories) &&
      filterMatches.length > 0
    ) {
      setFilterMatches([])

      if (filteredFunctions.length > 0) {
        setFilteredFunctions([])
      }

      if (!isEmpty(filteredTemplates)) {
        const filteredByCategory = !isEmpty(filtersStoreHubCategories)

        setFilteredTemplates(getFilteredTemplates(templates, filteredByCategory))
      }
    }
  }, [
    filterByName.length,
    filterMatches.length,
    filteredFunctions.length,
    filteredTemplates,
    filtersStoreHubCategories,
    getFilteredTemplates,
    setFilteredFunctions,
    setFilteredTemplates,
    templates
  ])

  const generateData = functionData => {
    if (!isEmpty(functionData)) {
      const [jobFormData, jobAdditionalData] = generateJobWizardData(
        frontendSpec,
        functionData,
        defaultData,
        params.projectName,
        currentProject,
        isEditMode
      )

      const newInitial = {
        ...cloneDeep(formState.initialValues),
        ...cloneDeep(jobFormData)
      }

      formState.form.reset(newInitial)
      setJobAdditionalData(jobAdditionalData)
    }
  }

  const handleSearchOnChange = value => {
    setFilterByName(value)
  }

  const onSelectedProjectNameChange = currentValue => {
    dispatch(
      fetchFunctions({
        project: currentValue,
        filters: {},
        config: {},
        setRequestErrorMessage: setFunctionsRequestErrorMessage
      })
    )
      .unwrap()
      .then(response => {
        if (response?.funcs) {
          const validFunctions = response.funcs.filter(func => {
            return includes(FUNCTION_RUN_KINDS, func.kind)
          })

          const groupedFunctions = Object.values(
            validFunctions.reduce((prev, curr) => {
              if (!prev[curr.metadata.name]) {
                prev[curr.metadata.name] = {
                  name: curr.metadata.name,
                  functions: []
                }
              }

              prev[curr.metadata.name].functions.push(curr)

              return prev
            }, Object.create(null))
          )

          setFunctions(groupedFunctions)

          if (filterByName.length > 0) {
            const filteredFunctions = groupedFunctions.filter(func => {
              return func.name.includes(filterByName)
            })

            setFilteredFunctions(filteredFunctions)
          }
        }
      })
      .catch(() => {
        setFunctions([])
      })

    formState.initialValues[FUNCTION_SELECTION_STEP].projectName = currentValue
  }

  useEffect(() => {
    if (activeTab === FUNCTIONS_SELECTION_HUB_TAB && !hubFunctionLoadedRef.current) {
      dispatch(
        fetchHubFunctions({
          allowedHubFunctions: {},
          setRequestErrorMessage: setHubFunctionsRequestErrorMessage
        })
      )
        .unwrap()
        .then(templatesObject => {
          if (templatesObject) {
            setTemplatesCategories(templatesObject.hubFunctionsCategories)
            setTemplates(templatesObject.hubFunctions)

            formState.initialValues[FUNCTION_SELECTION_STEP].templatesLabels =
              templatesObject.hubFunctions.reduce((labels, template) => {
                labels[template.metadata.name] = template.ui.categories.map(categoryId => {
                  return {
                    id: categoryId,
                    key: getCategoryName(categoryId),
                    isKeyOnly: true
                  }
                })

                return labels
              }, {})

            hubFunctionLoadedRef.current = true
          }
        })
    }
  }, [activeTab, dispatch, formState.initialValues, setTemplates, setTemplatesCategories])

  const selectProjectFunction = functionData => {
    const selectNewFunction = () => {
      setSelectedFunctionData(functionData)
      generateData(functionData)
      setSelectedFunctionTab(FUNCTIONS_SELECTION_FUNCTIONS_TAB)
      setShowSchedule(false)
      selectedActiveTab.current = activeTab
    }

    if (
      selectedFunctionData?.functions?.[0].metadata.hash !==
      functionData?.functions?.[0].metadata?.hash
    ) {
      if (formState.dirty) {
        openResetConfirm(selectNewFunction)
      } else {
        selectNewFunction()
      }
    }
  }

  const selectTemplateFunction = functionData => {
    const selectNewFunction = () => {
      const functionTemplatePath = `${functionData.spec.item_uri}${functionData.spec.assets.function}`

      dispatch(fetchFunctionTemplate({ path: functionTemplatePath }))
        .unwrap()
        .then(result => {
          setSelectedFunctionData(result)
          generateData(result)
          setSelectedFunctionTab(FUNCTIONS_SELECTION_HUB_TAB)
          setShowSchedule(false)
          selectedActiveTab.current = activeTab
        })
    }

    if (
      selectedFunctionData?.functions?.[0].metadata.name !== functionData?.metadata?.name ||
      selectedFunctionData?.functions?.[0].metadata.project
    ) {
      if (formState.dirty) {
        openResetConfirm(selectNewFunction)
      } else {
        selectNewFunction()
      }
    }
  }

  const openResetConfirm = confirmHandler => {
    return openConfirmPopUp('All changes will be lost', confirmHandler)
  }

  useEffect(() => {
    const isTabActive = selectedActiveTab.current && selectedActiveTab.current === activeTab

    if (stepIsActive && isTabActive) {
      scrollToElement(functionsContainerRef, '.selected')
    } else if (!stepIsActive && !isTabActive) {
      setActiveTab(selectedActiveTab.current)
    }
  }, [stepIsActive, activeTab, setActiveTab, selectedActiveTab])

  return (
    <div className="job-wizard__function-selection">
      <div className="form-row">
        <h5 className="form-step-title">Function selection</h5>
      </div>
      <ContentMenu
        activeTab={activeTab}
        tabs={functionsSelectionTabs}
        onClick={newTab => {
          setFilterByName('')
          setActiveTab(newTab)
        }}
      />
      {activeTab === FUNCTIONS_SELECTION_FUNCTIONS_TAB && (
        <div className="functions-tab">
          <div className="form-row">
            <Search
              id="search-functions"
              matches={filterMatches}
              onChange={value => handleSearchOnChange(value)}
              placeholder="Search functions..."
              setMatches={setFilterMatches}
              value={filterByName}
            />
          </div>
          <div className="form-row">
            <div className="form-row__project-name">
              <FormSelect name={`${FUNCTION_SELECTION_STEP}.projectName`} options={projects} />
            </div>
          </div>
          {!loading &&
          ((filterByName.length > 0 &&
            (filterMatches.length === 0 || isEmpty(filteredFunctions))) ||
            isEmpty(functions)) ? (
            <NoData message={functionsRequestErrorMessage} />
          ) : (
            <div className="functions-list" ref={functionsContainerRef}>
              {(filteredFunctions.length > 0 ? filteredFunctions : functions)
                .sort((prevFunc, nextFunc) => prevFunc.name.localeCompare(nextFunc.name))
                .map(functionData => {
                  return (
                    <FunctionCardTemplate
                      selected={
                        functionData?.functions?.[0].metadata?.hash ===
                        selectedFunctionData?.functions?.[0].metadata.hash
                      }
                      formState={formState}
                      functionData={generateFunctionCardData(functionData)}
                      onSelectCard={() => selectProjectFunction(functionData)}
                      key={functionData.name}
                    />
                  )
                })}
            </div>
          )}
        </div>
      )}
      {activeTab === FUNCTIONS_SELECTION_HUB_TAB && (
        <div className="hub-tab">
          <div className="form-row">
            <Search
              id="search-hub"
              className="hub-search"
              matches={filterMatches}
              onChange={value => handleSearchOnChange(value)}
              value={filterByName}
              placeholder="Search functions..."
              setMatches={setFilterMatches}
            />
            {!isTrain && (
              <FilterMenuModal
                header="Filter by category"
                wizardClassName="hub-filter"
                filterMenuName={JOB_WIZARD_FILTERS}
                initialValues={hubFiltersInitialValues}
                values={jobWizardFiltersValues}
              >
                <HubCategoriesFilter templates={filterTemplates} />
              </FilterMenuModal>
            )}
          </div>
          {!loading &&
          ((filterByName.length > 0 &&
            (filterMatches.length === 0 || isEmpty(filteredTemplates))) ||
            isEmpty(templates)) ? (
            <NoData message={hubFunctionsRequestErrorMessage} />
          ) : (
            <div className="functions-list" ref={functionsContainerRef}>
              {filteredTemplates
                .sort((prevTemplate, nextTemplate) =>
                  prevTemplate.metadata.name.localeCompare(nextTemplate.metadata.name)
                )
                .map(templateData => {
                  return (
                    <FunctionCardTemplate
                      selected={
                        templateData?.metadata?.name ===
                          selectedFunctionData?.functions?.[0].metadata.name &&
                        !selectedFunctionData?.functions?.[0].status &&
                        selectedFunctionTab === FUNCTIONS_SELECTION_HUB_TAB
                      }
                      formState={formState}
                      functionData={generateFunctionTemplateCardData(templateData)}
                      onSelectCard={event => {
                        if (!event.target.closest('.chips-wrapper')) {
                          selectTemplateFunction(templateData)
                        }
                      }}
                      key={templateData.metadata.name}
                    />
                  )
                })}
            </div>
          )}
        </div>
      )}
      <FormOnChange
        handler={onSelectedProjectNameChange}
        name={`${FUNCTION_SELECTION_STEP}.projectName`}
      />
    </div>
  )
}

JobWizardFunctionSelection.propTypes = {
  activeTab: PropTypes.string.isRequired,
  currentProject: PropTypes.object,
  defaultData: PropTypes.object.isRequired,
  filteredFunctions: PropTypes.arrayOf(PropTypes.object).isRequired,
  filteredTemplates: PropTypes.arrayOf(PropTypes.object).isRequired,
  formState: PropTypes.object.isRequired,
  frontendSpec: PropTypes.object.isRequired,
  functions: PropTypes.arrayOf(PropTypes.object).isRequired,
  isEditMode: PropTypes.bool.isRequired,
  isTrain: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  selectedFunctionData: PropTypes.object.isRequired,
  selectedFunctionTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  setFilteredFunctions: PropTypes.func.isRequired,
  setFilteredTemplates: PropTypes.func.isRequired,
  setFunctions: PropTypes.func.isRequired,
  setJobAdditionalData: PropTypes.func.isRequired,
  setSelectedFunctionData: PropTypes.func.isRequired,
  setSelectedFunctionTab: PropTypes.func.isRequired,
  setShowSchedule: PropTypes.func.isRequired,
  setTemplates: PropTypes.func.isRequired,
  setTemplatesCategories: PropTypes.func.isRequired,
  stepIsActive: PropTypes.bool,
  templates: PropTypes.arrayOf(PropTypes.object).isRequired,
  templatesCategories: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default JobWizardFunctionSelection
