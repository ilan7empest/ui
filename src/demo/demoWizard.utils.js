export const initialValues = {
  baseModel: {
    modelName: 'misttralai/Mistral-7B-v0.1'
  },
  datasets: {
    splitPercentage: 0.2
  },
  trainingParameters: {
    batchSize: 2,
    ephos: 1,
    validationParameters: {
      batchSize: 2
    }
  },
  loginParameters: {
    mlrunParameters: {
      key: 'model',
      labels: []
    },
    tensorboardParameters: {
      loggingDirectory: './tensorboard'
    }
  },
  advancedConfiguration: {
    trainingParameters: [
      {
        data: {
          key: 'Gradient Accumulation Steps',
          value: ''
        }
      },
      {
        data: {
          key: 'Warmups Steps',
          value: ''
        }
      }
    ],
    loraArguments: [
      {
        data: {
          key: 'Target Modules',
          value: ''
        }
      },
      {
        data: {
          key: 'r',
          value: ''
        }
      }
    ],
    deepspeedArguments: [
      {
        data: {
          key: 'Config file path',
          value: ''
        }
      }
    ]
  }
}

export const stepsConfig = [
  {
    id: 'BASE_MODEL',
    label: 'Base Model'
  },
  {
    id: 'DATESETS',
    label: 'Datesets'
  },
  {
    id: 'TRAINING_PARAMETERS',
    label: 'Training Parameters'
  },
  {
    id: 'LOGGING_PARAMETERS',
    label: 'Logging Parameters'
  },
  {
    id: 'ADVANCED_CONFIGURATIONS',
    label: 'Advanced Configuration'
  },
  {
    id: 'RESOURCES',
    label: 'Resources'
  },
  {
    id: 'REVIEW',
    label: 'Review'
  }
]

export const baseModelSelectionTabs = [
  {
    id: 'HUGGINGFACE_HUB',
    label: 'Huggingface Hub'
  },
  {
    id: 'MLRUN_MODEL_REGISTRY',
    label: 'MLRun Model Registry'
  },
  {
    id: 'LOCAL_FILE',
    label: 'Local File'
  }
]

export const trainingSetSelectionTabs = [
  {
    id: 'HUGGINGFACE_DATASET_HUB',
    label: 'Huggingface Hub'
  },
  {
    id: 'MLRUN_DATASET_REGISTRY',
    label: 'MLRun  Registry'
  },
  {
    id: 'LOCAL_DATASET_FILE',
    label: 'Local File'
  }
]
