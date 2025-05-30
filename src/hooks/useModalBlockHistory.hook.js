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
import { useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

import { defaultCloseModalHandler } from '../utils/defaultCloseModalHandler'
import { areFormValuesChanged } from 'igz-controls/utils/form.util'

export const useModalBlockHistory = (closeModal, form) => {
  const shouldBlock = useCallback(({ currentLocation, nextLocation }) => {
    const { initialValues, values } = form.getState()

    const isFormDirty = areFormValuesChanged(initialValues, values)

    if (!isFormDirty && currentLocation.pathname !== nextLocation.pathname) {
      closeModal()
    }

    return isFormDirty && currentLocation.pathname !== nextLocation.pathname
  }, [closeModal, form])

  let blocker = useBlocker(shouldBlock)

  const resolveModal = useCallback(() => {
    closeModal()
    form.reset(form.initialValues)
    blocker.proceed?.()
  }, [blocker, closeModal, form])

  const handleRejectConfirmation = useCallback(() => {
    blocker.reset?.()
  }, [blocker])

  const handleCloseModal = useCallback(() => {
    const { initialValues, values } = form.getState()

    const showConfirmation = areFormValuesChanged(initialValues, values)

    defaultCloseModalHandler(showConfirmation, resolveModal, handleRejectConfirmation)
  }, [form, resolveModal, handleRejectConfirmation])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      handleCloseModal()
    }
  }, [blocker, handleCloseModal])

  return { handleCloseModal, resolveModal }
}
