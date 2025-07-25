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
import { Form } from 'react-final-form'
import { createForm } from 'final-form'
import PropTypes from 'prop-types'
import arrayMutators from 'final-form-arrays'

import { FormChipCell } from 'igz-controls/components'

import { getChipOptions } from 'igz-controls/utils/chips.util'
import { setFieldState } from 'igz-controls/utils/form.util'
import { CHIP_OPTIONS } from 'igz-controls/types'

const ReadOnlyChips = ({ labels = [], chipOptions = getChipOptions('metrics'), ...args }) => {
  const formRef = React.useRef(
    createForm({
      initialValues: { labels: labels },
      mutators: { ...arrayMutators, setFieldState },
      onSubmit: () => {}
    })
  )

  return (
    <Form form={formRef.current} onSubmit={() => {}}>
      {formState => {
        return (
          <FormChipCell
            chipOptions={chipOptions}
            formState={formState}
            isEditable={false}
            initialValues={formState.initialValues}
            name="labels"
            {...args}
          />
        )
      }}
    </Form>
  )
}

ReadOnlyChips.propTypes = {
  chipOptions: CHIP_OPTIONS,
  labels: PropTypes.array
}

export default ReadOnlyChips
