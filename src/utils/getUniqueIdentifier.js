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
import { get } from 'lodash'
import {
  ADD_TO_FEATURE_VECTOR_TAB,
  ALERTS_PAGE,
  FEATURE_SETS_TAB,
  FEATURE_VECTORS_TAB,
  FEATURES_TAB
} from '../constants'

export const getArtifactIdentifier = (artifact, unique) => {
  let identifier = ''

  if (artifact?.db_key || artifact?.spec?.db_key) {
    identifier = artifact?.db_key || artifact?.spec?.db_key
  } else if (artifact?.spec?.model_name) {
    identifier = `${artifact?.spec?.model_name}.${artifact?.spec?.function_uri}`
  }

  if (unique) {
    if (artifact?.uid) identifier += `.${artifact.uid}`
    if (artifact?.metadata?.uid) identifier += `.${artifact.metadata.uid}`
    if (artifact?.tag) identifier += `.${artifact?.tag}`
    if (artifact?.metadata?.tag) identifier += `.${artifact?.metadata?.tag}`
  }

  return identifier && `id.${identifier}`
}

export const getFunctionIdentifier = (func, unique) => {
  let identifier = `${func?.name || ''}`

  if (unique) {
    if (func?.hash) identifier += `.${func.hash}`
    if (func?.tag) identifier += `.${func.tag}`
  }

  return identifier && `id.${identifier}`
}
export const getAlertIdentifier = (alert, unique) => {
  let identifier = `${alert?.name || ''}`

  if (unique && alert?.id) identifier += `.${alert.id}`
  return identifier && `id.${identifier}`
}

export const getJobIdentifier = (job, unique) => {
  let identifier = `${job?.name || ''}`

  if (unique && job?.uid) identifier += `.${job.uid}`

  return identifier && `id.${identifier}`
}

export const getWorkflowJobIdentifier = (job, unique) => {
  let identifier = ''
  let jobId = ''

  if (job.customData.run_uid) {
    identifier = job.name
  } else if (job.customData?.function && job.customData?.functionName) {
    identifier = job.customData?.functionName
  }

  if (unique) {
    jobId = job.customData.run_uid ? job.customData.run_uid : (job.customData?.functionHash ?? '')
  }

  if (jobId) identifier += `.${jobId}`

  return identifier && `id.${identifier}`
}

export const getFeatureIdentifier = (feature, unique) => {
  let identifier = `${feature?.name || ''}`

  if (unique && feature.metadata?.tag) identifier += `.${feature.metadata.tag}`
  if (feature.metadata?.name) identifier += `.${feature.metadata.name}`
  if (feature.ui?.type) identifier += `.${feature.ui.type}`

  return identifier && `id.${identifier}`
}

export const getFeatureSetIdentifier = (featureSet, unique) => {
  let identifier = `${featureSet?.name || ''}`

  if (unique && featureSet?.tag) identifier += `.${featureSet.tag}`
  if (unique && featureSet?.uid) identifier += `.${featureSet.uid}`

  return identifier && `id.${identifier}`
}

export const getFeatureVectorIdentifier = (featureVector, unique) => {
  let identifier = `${featureVector?.name || ''}`

  if (unique && featureVector?.tag) identifier += `.${featureVector.tag}`
  if (unique && featureVector?.uid) identifier += `.${featureVector.uid}`

  return identifier && `id.${identifier}`
}

export const getV3ioStreamIdentifier = (v3ioStream, consumerGroupIsObject) => {
  const identifier = get(
    v3ioStream,
    consumerGroupIsObject ? 'consumerGroup.identifierUnique' : 'consumerGroup',
    ''
  )

  return consumerGroupIsObject ? identifier : `id.${identifier}`
}

export const getV3ioStreamShardLagIdentifier = (v3ioStream, shardLagIdIsObject) => {
  const identifier = get(
    v3ioStream,
    shardLagIdIsObject ? 'shardLagId.identifierUnique' : 'shardLagId',
    ''
  )

  return shardLagIdIsObject ? identifier : `id.${identifier}`
}

export const getIdentifierMethod = tab => {
  switch (tab) {
    case ALERTS_PAGE:
      return getAlertIdentifier
    case FEATURES_TAB:
    case ADD_TO_FEATURE_VECTOR_TAB:
      return getFeatureIdentifier
    case FEATURE_SETS_TAB:
      return getFeatureSetIdentifier
    case FEATURE_VECTORS_TAB:
      return getFeatureVectorIdentifier
    default:
      return getFeatureIdentifier
  }
}
