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
import { keyBy } from 'lodash'
import { getFeatureIdentifier } from './getUniqueIdentifier'

export const parseFeatures = (featuresResp, filterByFeatureSetName) => {
  const type = featuresResp.features ? 'feature' : 'entity'
  const groupedFeatureSets = keyBy(featuresResp.feature_set_digests, 'feature_set_index')
  let features = featuresResp[type === 'feature' ? 'features' : 'entities'] || []

  if (filterByFeatureSetName) {
    features = features.filter(feature => {
      return (
        groupedFeatureSets[feature.feature_set_index]?.metadata?.name === filterByFeatureSetName
      )
    })
  }

  return features.map(feature => {
    const item = {
      ...feature,
      ...(groupedFeatureSets[feature.feature_set_index] || {}),
      ui: {
        type: type,
        originalContent: {
          [type]: feature,
          feature_set_digest: groupedFeatureSets[feature.feature_set_index] || {}
        }
      }
    }

    return {
      ...item,
      updated: item.metadata?.updated, // added updated property from feature_set_digest for correct grouping to get correct last items
      ui: {
        ...item.ui,
        identifier: getFeatureIdentifier(item),
        identifierUnique: getFeatureIdentifier(item, true)
      }
    }
  })
}
