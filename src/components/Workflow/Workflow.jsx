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
import React, { useEffect, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { forEach, isEmpty, lowerCase } from 'lodash'
import { useNavigate, useParams } from 'react-router-dom'

import Details from '../Details/Details'
import JobsFunctionsTableRow from './JobsFunctionsTableRow/JobsFunctionsTableRow'
import MlReactFlow from '../../common/ReactFlow/MlReactFlow'
import Table from '../Table/Table'
import TableTop from '../../elements/TableTop/TableTop'
import { Button, Tooltip, TextTooltipTemplate } from 'igz-controls/components'

import {
  getLayoutedElements,
  getWorkflowSourceHandle
} from '../../common/ReactFlow/mlReactFlow.util'
import {
  fetchMissingProjectPermission,
  getWorkflowDetailsLink,
  getWorkflowMonitoringDetailsLink,
  isWorkflowStepCondition,
  isWorkflowStepExecutable,
  isWorkflowStepVisible
} from './workflow.util'
import {
  DEFAULT_EDGE,
  FUNCTION_RUNNING_STATE,
  GREY_NODE,
  JOB_KIND_JOB,
  JOBS_PAGE,
  ML_EDGE,
  ML_NODE,
  MONITOR_WORKFLOWS_TAB,
  OVAL_NODE_SHAPE,
  PRIMARY_NODE,
  WORKFLOW_GRAPH_VIEW,
  WORKFLOW_LIST_VIEW
} from '../../constants'
import getState from '../../utils/getState'
import { ACTIONS_MENU } from 'igz-controls/types'
import { createJobsWorkflowContent } from '../../utils/createJobsContent'
import { getCloseDetailsLink } from '../../utils/link-helper.util'
import { useMode } from '../../hooks/mode.hook'
import { useSortTable } from '../../hooks/useSortTable.hook'
import { useDispatch, useSelector } from 'react-redux'

import Cancel from 'igz-controls/images/cancel.svg?react'
import ListView from 'igz-controls/images/listview.svg?react'
import Pipelines from 'igz-controls/images/pipelines.svg?react'

import './workflow.scss'

const Workflow = ({
  actionsMenu,
  backLink,
  handleCancel,
  handleConfirmTerminateWorkflow,
  itemIsSelected,
  pageData,
  selectedFunction = {},
  selectedJob = {},
  setWorkflowsViewMode,
  workflow = {},
  workflowsViewMode
}) => {
  const [jobsContent, setJobsContent] = useState([])
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const params = useParams()
  const navigate = useNavigate()
  const { isStagingMode } = useMode()
  const projectName = params.workflowProjectName || params.projectName
  const dispatch = useDispatch()
  const accessibleProjectsMap = useSelector(state => state.projectStore.accessibleProjectsMap)

  useEffect(() => {
    fetchMissingProjectPermission(projectName, accessibleProjectsMap, dispatch)
  }, [dispatch, projectName, accessibleProjectsMap])

  const graphViewClassNames = classnames(
    'graph-view',
    (selectedJob?.uid || selectedFunction?.hash) && 'with-selected-job'
  )

  const tableContent = useMemo(() => {
    return createJobsWorkflowContent(
      jobsContent,
      params.projectName,
      params.workflowProjectName,
      params.workflowId,
      isStagingMode,
      !isEmpty(selectedJob)
    )
  }, [
    isStagingMode,
    jobsContent,
    params.projectName,
    params.workflowProjectName,
    params.workflowId,
    selectedJob
  ])

  const { sortedTableContent } = useSortTable({
    headers: tableContent[0]?.content,
    content: tableContent,
    sortConfig: { defaultSortBy: 'startedAt' }
  })

  useEffect(() => {
    const newEdges = []
    const newNodes = []
    const jobs = []

    forEach(workflow.graph, job => {
      const sourceHandle = getWorkflowSourceHandle(job.phase)

      if (!isWorkflowStepVisible(job) && !job.ui?.isHiddenJobVisible) return

      const customData = {
        function: job.function,
        run_uid: job.run_uid,
        run_type: job.run_type,
        type: job.type
      }
      const stepIsExecutable = isWorkflowStepExecutable(job)
      const stepIsCondition = isWorkflowStepCondition(job)

      if (job.function) {
        const [, , functionName = '', functionHash = '', functionTag = ''] =
          job.function?.match(/^([\w.-]+)\/([\w.-]+)(?:@(\w+))?(?::(\w+))?$/) ?? []

        customData.functionName = functionName
        customData.functionHash = functionHash ?? functionTag
      }

      let nodeItem = {
        id: job.id,
        type: ML_NODE,
        data: {
          customData,
          isSelectable: stepIsExecutable,
          shape: stepIsCondition ? OVAL_NODE_SHAPE : null,
          label: job.name,
          sourceHandle,
          tip: stepIsExecutable || stepIsCondition ? null : 'This step cannot be previewed',
          subType: !stepIsExecutable || stepIsCondition ? GREY_NODE : PRIMARY_NODE
        },
        className: classnames(
          ((job.run_uid && selectedJob.uid === job.run_uid) ||
            (job.run_type === 'deploy' &&
              (job.function.includes(selectedFunction.hash) ||
                job.function.includes(selectedFunction.name))) ||
            (job.run_type === 'build' && job.function.includes(selectedFunction.name))) &&
            `${sourceHandle.className} selected`
        ),
        position: { x: 0, y: 0 }
      }

      job.children.forEach(childId => {
        newEdges.push({
          id: `e.${job.id}.${childId}`,
          type: ML_EDGE,
          data: {
            subType: DEFAULT_EDGE,
            isSelectable: true
          },
          source: job.id,
          target: childId
        })
      })

      jobs.push({
        ...job,
        customData,
        state: getState(job.phase?.toLowerCase(), JOBS_PAGE, JOB_KIND_JOB)
      })
      newNodes.push(nodeItem)
    })

    if (!isEmpty(newNodes)) {
      const [layoutedNodes, layoutedEdges] = getLayoutedElements(newNodes, newEdges)

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      setJobsContent(jobs)
    }
  }, [selectedFunction.hash, selectedFunction.name, selectedJob.uid, workflow.graph])

  const onNodeClick = (event, node) => {
    const detailsLink = params.workflowProjectName
      ? getWorkflowMonitoringDetailsLink(
          params.workflowProjectName,
          params.workflowId,
          node.data.customData,
          params.tab
        )
      : getWorkflowDetailsLink(
          params.projectName,
          params.workflowId,
          node.data.customData,
          params.tab,
          MONITOR_WORKFLOWS_TAB
        )

    if (detailsLink) {
      navigate(detailsLink)
    }
  }

  return (
    <div className="workflow-container">
      <TableTop link={backLink} text={workflow?.run?.name.replace(`${params.projectName}-`, '')}>
        <div className="workflow__actions-container">
          <div className="actions">
            <Tooltip
              template={
                <TextTooltipTemplate
                  text={
                    workflowsViewMode === WORKFLOW_GRAPH_VIEW
                      ? 'Switch to list view'
                      : 'Switch to graph view'
                  }
                />
              }
            >
              <button
                className="toggle-view-btn"
                onClick={() =>
                  setWorkflowsViewMode(
                    workflowsViewMode === WORKFLOW_GRAPH_VIEW
                      ? WORKFLOW_LIST_VIEW
                      : WORKFLOW_GRAPH_VIEW
                  )
                }
              >
                {workflowsViewMode === WORKFLOW_GRAPH_VIEW ? <ListView /> : <Pipelines />}
              </button>
            </Tooltip>
          </div>
          {accessibleProjectsMap[projectName] && (
            <Button
              className="workflow_btn"
              id="terminate_btn"
              disabled={lowerCase(workflow?.run?.status) !== FUNCTION_RUNNING_STATE}
              variant="danger"
              icon={<Cancel />}
              label="Terminate"
              onClick={() => handleConfirmTerminateWorkflow(workflow?.run, dispatch)}
            />
          )}
        </div>
      </TableTop>

      <div className="graph-container workflow-content">
        {workflowsViewMode === WORKFLOW_GRAPH_VIEW ? (
          <div className={graphViewClassNames}>
            <MlReactFlow
              alignTriggerItem={itemIsSelected}
              edges={edges}
              nodes={nodes}
              onNodeClick={onNodeClick}
            />
            {itemIsSelected && (
              <Details
                actionsMenu={actionsMenu}
                detailsMenu={pageData.details.menu}
                getCloseDetailsLink={() => getCloseDetailsLink(params.workflowId)}
                handleCancel={handleCancel}
                pageData={pageData}
                selectedItem={!isEmpty(selectedFunction) ? selectedFunction : selectedJob}
                tab={MONITOR_WORKFLOWS_TAB}
              />
            )}
          </div>
        ) : (
          <Table
            actionsMenu={actionsMenu}
            getCloseDetailsLink={() => getCloseDetailsLink(params.workflowId)}
            handleCancel={handleCancel}
            hideActionsMenu
            pageData={pageData}
            selectedItem={!isEmpty(selectedFunction) ? selectedFunction : selectedJob}
            tableHeaders={sortedTableContent[0]?.content ?? []}
          >
            {sortedTableContent.map((tableItem, index) => (
              <JobsFunctionsTableRow
                actionsMenu={actionsMenu}
                key={index}
                rowItem={tableItem}
                selectedItem={!isEmpty(selectedFunction) ? selectedFunction : selectedJob}
              />
            ))}
          </Table>
        )}
      </div>
    </div>
  )
}

Workflow.propTypes = {
  actionsMenu: ACTIONS_MENU.isRequired,
  backLink: PropTypes.string.isRequired,
  handleCancel: PropTypes.func.isRequired,
  handleConfirmTerminateWorkflow: PropTypes.func,
  itemIsSelected: PropTypes.bool.isRequired,
  pageData: PropTypes.object.isRequired,
  selectedFunction: PropTypes.object,
  selectedJob: PropTypes.object,
  setWorkflowsViewMode: PropTypes.func.isRequired,
  workflow: PropTypes.object,
  workflowsViewMode: PropTypes.string.isRequired
}

export default React.memo(Workflow)
