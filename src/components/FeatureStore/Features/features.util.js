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
import {
  LABELS_FILTER,
  LARGE_REQUEST_CANCELED,
  NAME_FILTER,
  TAG_FILTER,
  TAG_FILTER_LATEST
} from '../../../constants'
import { showLargeResponsePopUp } from '../../../httpClient'
import { largeResponseCatchHandler } from '../../../utils/largeResponseCatchHandler'

export const filtersConfig = {
  [TAG_FILTER]: { label: 'Version Tag:', initialValue: TAG_FILTER_LATEST, isModal: true },
  [NAME_FILTER]: { label: 'Name:', initialValue: '' },
  [LABELS_FILTER]: { label: 'Labels:', initialValue: '', isModal: true }
}

export const handleFeaturesResponse = (
  features,
  setFeatures,
  abortControllerRef,
  setRequestErrorMessage,
  error,
  dispatch
) => {
  if (
    features?.length > 10000 ||
    abortControllerRef.current?.signal?.reason === LARGE_REQUEST_CANCELED
  ) {
    showLargeResponsePopUp(setRequestErrorMessage)
    setFeatures([])
  } else if (features?.length) {
    setFeatures(features)
    setRequestErrorMessage('')
  } else if (error && dispatch) {
    largeResponseCatchHandler(error, 'Failed to fetch features', dispatch, setRequestErrorMessage)
  }

  return features || []
}
