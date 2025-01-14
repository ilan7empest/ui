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
import { debounce, isEqual } from 'lodash'

import DeleteArtifactPopUp from '../../elements/DeleteArtifactPopUp/DeleteArtifactPopUp'

import {
  ARTIFACTS_TAB,
  ARTIFACT_MAX_DOWNLOAD_SIZE,
  ARTIFACT_OTHER_TYPE,
  ARTIFACT_TYPE,
  ALL_VERSIONS_PATH,
  FILES_PAGE,
  FILES_TAB,
  FULL_VIEW_MODE,
  ITERATIONS_FILTER,
  LABELS_FILTER,
  NAME_FILTER,
  TAG_FILTER,
  TAG_FILTER_ALL_ITEMS,
  TAG_FILTER_LATEST,
  VIEW_SEARCH_PARAMETER,
  BE_PAGE,
  SHOW_ITERATIONS
} from '../../constants'
import { applyTagChanges, chooseOrFetchArtifact } from '../../utils/artifacts.util'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { getIsTargetPathValid } from '../../utils/createArtifactsContent'
import { showArtifactsPreview } from '../../reducers/artifactsReducer'
import { generateUri } from '../../utils/resources'
import { handleDeleteArtifact } from '../../utils/handleDeleteArtifact'
import { openDeleteConfirmPopUp, openPopUp } from 'igz-controls/utils/common.util'
import { searchArtifactItem } from '../../utils/searchArtifactItem'
import { setDownloadItem, setShowDownloadsList } from '../../reducers/downloadReducer'
import { getFilteredSearchParams } from '../../utils/filter.util'
import { parseIdentifier } from '../../utils'

import { ReactComponent as TagIcon } from 'igz-controls/images/tag-icon.svg'
import { ReactComponent as YamlIcon } from 'igz-controls/images/yaml.svg'
import { ReactComponent as ArtifactView } from 'igz-controls/images/eye-icon.svg'
import { ReactComponent as Copy } from 'igz-controls/images/copy-to-clipboard-icon.svg'
import { ReactComponent as Delete } from 'igz-controls/images/delete.svg'
import { ReactComponent as DownloadIcon } from 'igz-controls/images/download.svg'
import { ReactComponent as HistoryIcon } from 'igz-controls/images/history.svg'

export const getFiltersConfig = isAllVersions => ({
  [NAME_FILTER]: { label: 'Name:', initialValue: '', hidden: isAllVersions },
  [TAG_FILTER]: {
    label: 'Version tag:',
    initialValue: isAllVersions ? TAG_FILTER_ALL_ITEMS : TAG_FILTER_LATEST,
    isModal: true
  },
  [LABELS_FILTER]: { label: 'Labels:', initialValue: '', isModal: true },
  [ITERATIONS_FILTER]: {
    label: 'Show best iteration only:',
    initialValue: isAllVersions ? '' : SHOW_ITERATIONS,
    isModal: true
  }
})

export const pageDataInitialState = {
  details: {
    menu: [],
    infoHeaders: []
  },
  filters: [],
  page: '',
  registerArtifactDialogTitle: '',
  tableHeaders: []
}

export const detailsMenu = [
  {
    label: 'overview',
    id: 'overview'
  },
  {
    label: 'preview',
    id: 'preview'
  }
]

export const infoHeaders = [
  {
    label: 'Hash',
    id: 'hash',
    tip: 'Represents hash of the data. when the data changes the hash would change'
  },
  { label: 'Key', id: 'db_key' },
  { label: 'Version tag', id: 'tag' },
  { label: 'Iter', id: 'iter' },
  { label: 'Size', id: 'size' },
  { label: 'Path', id: 'target_path' },
  { label: 'URI', id: 'target_uri' },
  { label: 'Updated', id: 'updated' },
  { label: 'Labels', id: 'labels' }
]

export const generatePageData = viewMode => {
  return {
    page: FILES_PAGE,
    details: {
      type: FILES_TAB,
      menu: detailsMenu,
      infoHeaders,
      hideBackBtn: viewMode === FULL_VIEW_MODE,
      withToggleViewBtn: true
    }
  }
}

export const registerArtifactTitle = 'Register artifact'

export const handleApplyDetailsChanges = (
  changes,
  projectName,
  selectedItem,
  setNotification,
  dispatch
) => {
  return applyTagChanges(changes, selectedItem, projectName, dispatch, setNotification)
}

export const checkForSelectedFile = debounce(
  (
    paramsName,
    files,
    paramsId,
    projectName,
    setSelectedFile,
    navigate,
    isAllVersions,
    searchParams,
    paginationConfigRef
  ) => {
    if (paramsId) {
      const searchBePage = parseInt(searchParams.get(BE_PAGE))
      const configBePage = paginationConfigRef.current[BE_PAGE]
      const { tag, uid, iter } = parseIdentifier(paramsId)

      if (files.length > 0 && searchBePage === configBePage) {
        const searchItem = searchArtifactItem(
          files.map(artifact => artifact.data ?? artifact),
          paramsName,
          tag,
          iter,
          uid
        )

        if (!searchItem) {
          navigate(
            `/projects/${projectName}/files${isAllVersions ? `/${paramsName}/${ALL_VERSIONS_PATH}` : ''}${getFilteredSearchParams(
              window.location.search,
              [VIEW_SEARCH_PARAMETER]
            )}`,
            { replace: true }
          )
        } else {
          setSelectedFile(prevState => {
            return isEqual(prevState, searchItem) ? prevState : searchItem
          })
        }
      }
    } else {
      setSelectedFile({})
    }
  }
)

export const generateActionsMenu = (
  fileMin,
  frontendSpec,
  dispatch,
  toggleConvertedYaml,
  handleAddTag,
  projectName,
  handleRefresh,
  filters,
  selectedFile,
  showAllVersions,
  isAllVersions,
  isDetailsPopUp = false
) => {
  const isTargetPathValid = getIsTargetPathValid(fileMin ?? {}, frontendSpec)

  const getFullFile = fileMin => {
    return chooseOrFetchArtifact(dispatch, FILES_TAB, selectedFile, fileMin)
  }

  return [
    [
      {
        label: 'Add a tag',
        hidden: isDetailsPopUp,
        icon: <TagIcon />,
        onClick: handleAddTag
      },
      {
        label: 'Download',
        disabled:
          !isTargetPathValid ||
          fileMin.size >
            (frontendSpec?.artifact_limits?.max_download_size ?? ARTIFACT_MAX_DOWNLOAD_SIZE),
        icon: <DownloadIcon />,
        onClick: fileMin => {
          getFullFile(fileMin).then(file => {
            const downloadPath = `${fileMin?.target_path}${fileMin?.model_file || ''}`
            dispatch(
              setDownloadItem({
                path: downloadPath,
                user: file.producer?.owner,
                id: downloadPath,
                artifactLimits: frontendSpec?.artifact_limits,
                fileSize: file.size,
                projectName
              })
            )
            dispatch(setShowDownloadsList(true))
          })
        }
      },
      {
        label: 'Copy URI',
        icon: <Copy />,
        onClick: file => copyToClipboard(generateUri(file, ARTIFACTS_TAB), dispatch)
      },
      {
        label: 'View YAML',
        icon: <YamlIcon />,
        onClick: fileMin => getFullFile(fileMin).then(toggleConvertedYaml)
      },
      {
        label: 'Delete',
        icon: <Delete />,
        hidden: isDetailsPopUp,
        className: 'danger',
        onClick: () =>
          openPopUp(DeleteArtifactPopUp, {
            artifact: fileMin,
            artifactType: ARTIFACT_TYPE,
            category: ARTIFACT_OTHER_TYPE,
            filters,
            handleRefresh
          })
      },
      {
        label: 'Delete all versions',
        icon: <Delete />,
        hidden: isAllVersions || isDetailsPopUp,
        className: 'danger',
        onClick: () =>
          openDeleteConfirmPopUp(
            'Delete artifact?',
            `Do you want to delete all versions of the artifact "${fileMin.db_key}"? Deleted artifacts can not be restored.`,
            () => {
              handleDeleteArtifact(
                dispatch,
                projectName,
                fileMin.db_key,
                fileMin.uid,
                handleRefresh,
                filters,
                ARTIFACT_TYPE,
                ARTIFACT_OTHER_TYPE,
                true
              )
            }
          )
      }
    ],
    [
      {
        id: 'show-all-versions',
        label: 'Show all versions',
        icon: <HistoryIcon />,
        onClick: () => showAllVersions(fileMin.db_key),
        hidden: isAllVersions
      },
      {
        label: 'Preview',
        id: 'artifact-preview',
        disabled: !isTargetPathValid,
        icon: <ArtifactView />,
        onClick: fileMin => {
          getFullFile(fileMin).then(file => {
            dispatch(
              showArtifactsPreview({
                isPreview: true,
                selectedItem: file
              })
            )
          })
        }
      }
    ]
  ]
}
