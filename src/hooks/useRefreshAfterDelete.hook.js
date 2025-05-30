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
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BE_PAGE } from '../constants'

export const useRefreshAfterDelete = (
  paginationConfigRef,
  historyBackLink,
  responsePath,
  closeDetailsLink,
  isAllVersions
) => {
  const [refreshAfterDeleteTrigger, setRefreshAfterDeleteTrigger] = useState(null)
  const navigate = useNavigate()

  const refreshAfterDeleteCallback = useCallback(
    response => {
      if (
        isAllVersions &&
        response?.[responsePath]?.length === 0 &&
        paginationConfigRef?.current?.[BE_PAGE] === 1
      ) {
        navigate(historyBackLink)
        setRefreshAfterDeleteTrigger(Math.random())
      } else if (closeDetailsLink) {
        navigate(closeDetailsLink)
      }
    },
    [responsePath, paginationConfigRef, navigate, historyBackLink, closeDetailsLink, isAllVersions]
  )

  return [refreshAfterDeleteCallback, refreshAfterDeleteTrigger]
}
