import React from 'react'

import DemoWizard from '../DemoWizard'
import { Button } from 'igz-controls/components'

import { openPopUp } from 'igz-controls/utils/common.util'

const Demo = () => {
  const openWizard = () => {
    openPopUp(DemoWizard, {
      wizardTitle: 'LLM fine-tuning'
    })
  }

  return <Button label="OPEN DEMO" className="btn_register" onClick={openWizard} />
}

export default Demo
