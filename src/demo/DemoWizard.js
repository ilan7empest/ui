import React, { useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Form } from 'react-final-form'
import { createForm } from 'final-form'
import arrayMutators from 'final-form-arrays'
import { setFieldState } from 'igz-controls/utils/form.util'
import Prism from 'prismjs'

import ContentMenu from '../elements/ContentMenu/ContentMenu'
import DemoStep from './DemoStep'

import {
  baseModelSelectionTabs,
  initialValues,
  stepsConfig,
  trainingSetSelectionTabs
} from './demoWizard.utils'
import { selectUnitOptions } from '../elements/FormResourcesUnits/formResourcesUnits.util'
import { setNotification } from '../reducers/notificationReducer'

import { useYaml } from '../hooks/yaml.hook'

import {
  FormCheckBox,
  FormChipCell,
  FormInput,
  FormKeyValueTable,
  FormSelect
} from 'igz-controls/components'
import { Wizard } from 'igz-controls/components'

import './demoWizard.scss'

const DemoWizard = ({ isOpen, onResolve, wizardTitle }) => {
  const [activeTab, setActiveTab] = useState({
    baseModel: 'HUGGINGFACE_HUB',
    seperateDataset: 'HUGGINGFACE_DATASET_HUB',
    trainingSet: 'HUGGINGFACE_DATASET_HUB',
    validationSet: 'TRAINING_SET_SPLIT'
  })
  const [convertedYaml, toggleConvertedYaml] = useYaml('')
  const location = useLocation()
  const dispatch = useDispatch()

  const formRef = useRef(
    createForm({
      onSubmit: () => {},
      mutators: { ...arrayMutators, setFieldState },
      initialValues
    })
  )
  const formStateRef = useRef(null)

  const html = convertedYaml && Prism.highlight(convertedYaml, Prism.languages.yml, 'yml')

  const getActions = React.useCallback(
    (jumpToStep, formState) => {
      return [
        {
          id: 'REVIEW',
          label: 'Review',
          variant: 'primary',
          onClick: () => {
            jumpToStep(6)
            toggleConvertedYaml({
              ui: {
                originalContent: formState.values
              }
            })
          }
        }
      ]
    },
    [toggleConvertedYaml]
  )

  const getValidationSetSelectionTabs = useCallback(formState => {
    return [
      {
        id: 'TRAINING_SET_SPLIT',
        label: 'Training Set Split',
        disabled: !formState.values?.datasets?.isValidateDataset
      },
      {
        id: 'SEPERATE_DATASET',
        label: 'Seperate Dataset',
        disabled: !formState.values?.datasets?.isValidateDataset
      }
    ]
  }, [])

  const handleCloseWizard = useCallback(() => {
    dispatch(
      setNotification({
        status: 200,
        id: Math.random(),
        message: 'Job started successfully'
      })
    )
    onResolve()
  }, [dispatch, onResolve])

  return (
    <Form form={formRef.current} onSubmit={() => {}}>
      {formState => {
        formStateRef.current = formState

        return (
          <Wizard
            className="form demo-wizard"
            getActions={({ jumpToStep }) => getActions(jumpToStep, formState)}
            isWizardOpen={isOpen}
            location={location}
            onWizardResolve={handleCloseWizard}
            size="max"
            stepsConfig={stepsConfig}
            title={wizardTitle}
          >
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Base Model</h5>
              </div>
              <div className="form-row">
                <p>
                  Choose the pretrained model to finetune. This will be the base of your about-to-be
                  fine-tuned model.
                </p>
                <p>
                  You can select a model from the{' '}
                  <a
                    href="https://huggingface.co/models"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Huggingface hub
                  </a>
                  , MLRun project's model registry, or a local model file.
                </p>
              </div>
              <div className="form-row">
                <ContentMenu
                  activeTab={activeTab.baseModel}
                  tabs={baseModelSelectionTabs}
                  onClick={newTab => {
                    setActiveTab(state => ({ ...state, baseModel: newTab }))
                  }}
                />
              </div>

              {activeTab.baseModel === 'MLRUN_MODEL_REGISTRY' ? (
                <div>
                  <div className="form-row">
                    Only logged models will appear in the dropdown list. If you don't see the model
                    you want, you can log it using the MLRun UI or SDK.
                  </div>
                  <div className="form-row">
                    <FormSelect
                      label="Select a model artifact"
                      name="baseModel.modelArtifact"
                      options={[
                        {
                          id: 'Mode1',
                          label: 'Model 1'
                        },
                        {
                          id: 'Model2',
                          label: 'Model 2'
                        },
                        {
                          id: 'Model3',
                          label: 'Model 3'
                        }
                      ]}
                    />
                  </div>
                </div>
              ) : activeTab.baseModel === 'LOCAL_FILE' ? (
                <div>
                  <div className="form-row">
                    Full local path to a model file or directory (as expected in the Huggingface
                    API)
                  </div>
                  <div className="form-row">
                    <FormInput
                      label="Local path"
                      name="baseModel.localPath"
                      placeholder="Local path..."
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-row">
                    <div>
                      <p>
                        A huggingface pretrained model name is constructed as{' '}
                        <b>repository_name/model_name.</b>
                      </p>
                      Some models may be private or protected, so a token can be passed at the Token
                      field.
                    </div>
                  </div>
                  <div className="form-row">
                    <FormInput
                      label="Pretrained model name"
                      name="baseModel.modelName"
                      placeholder="misttralai/Mistral-7B-v0.1"
                    />
                  </div>
                  <div className="form-row">
                    <FormInput label="Token" name="baseModel.token" placeholder="Token..." />
                  </div>
                </div>
              )}
            </DemoStep>

            {/* Step 2: Datasets */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Datasets</h5>
              </div>
              <p>
                Choose the datasetsfor the finetuning process. Validation set can be chosen to be
                splitted from the training set or by selecting a valid validation set.
              </p>
              <p>
                You can select a dataset from the{' '}
                <a
                  href="https://huggingface.co/datasets"
                  className="link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Huggingface hub
                </a>
                , MLRun project's datasets registry, or a local path.
              </p>
              <div className="form-row form-table-title">Training Set</div>
              <div className="form-row">
                <ContentMenu
                  activeTab={activeTab.trainingSet}
                  tabs={trainingSetSelectionTabs}
                  onClick={newTab => {
                    setActiveTab(state => ({ ...state, trainingSet: newTab }))
                  }}
                />
              </div>

              {activeTab.trainingSet === 'MLRUN_DATASET_REGISTRY' ? (
                <div>
                  <div className="form-row">
                    Only logged datasets will appear in the dropdown list. If you don't see the
                    dataset you want, you can log it using the MLRun UI or SDK.
                  </div>
                  <div className="form-row">
                    <FormSelect
                      label="Select a dataset artifact"
                      name="datasets.datasetArtifact"
                      options={[
                        {
                          id: 'Dataset1',
                          label: 'Dataset 1'
                        },
                        {
                          id: 'Dataset2',
                          label: 'Dataset 2'
                        },
                        {
                          id: 'Dataset3',
                          label: 'Dataset 3'
                        }
                      ]}
                    />
                  </div>
                </div>
              ) : activeTab.trainingSet === 'LOCAL_DATASET_FILE' ? (
                <div>
                  <div className="form-row">
                    Full local path to a model file or directory (as expected in the Huggingface
                    API)
                  </div>
                  <div className="form-row">
                    <FormInput
                      label="Local path"
                      name="datasets.localPath"
                      placeholder="Local path..."
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-row">
                    <div>
                      <p>
                        A huggingface dataset name is constructed as{' '}
                        <b>repository_name/dataset_name.</b>
                      </p>
                      Some datasets may be private or protected, so a token can be passed at the
                      Token field.
                    </div>
                  </div>
                  <div className="form-row">
                    <FormInput
                      label="Dataset name"
                      name="datasets.datasetName"
                      placeholder="Dataset Name..."
                    />
                  </div>
                  <div className="form-row">
                    <FormInput label="Token" name="datasets.token" placeholder="Token..." />
                  </div>
                </div>
              )}
              <div className="form-row form-table-title">Validation Set</div>
              <div className="form-row">
                <FormCheckBox label="Perform Validation" name="datasets.isValidateDataset" />
              </div>
              <div className="form-row">
                <ContentMenu
                  activeTab={activeTab.validationSet}
                  tabs={getValidationSetSelectionTabs(formState)}
                  onClick={newTab => {
                    setActiveTab(state => ({ ...state, validationSet: newTab }))
                  }}
                />
              </div>
              {formState.values?.datasets?.isValidateDataset && (
                <>
                  {activeTab.validationSet !== 'TRAINING_SET_SPLIT' ? (
                    <>
                      <div className="form-row">
                        <ContentMenu
                          activeTab={activeTab.seperateDataset}
                          tabs={trainingSetSelectionTabs}
                          onClick={newTab => {
                            setActiveTab(state => ({ ...state, seperateDataset: newTab }))
                          }}
                        />
                      </div>

                      {activeTab.seperateDataset === 'MLRUN_DATASET_REGISTRY' ? (
                        <div>
                          <div className="form-row">
                            Only logged datasets will appear in the dropdown list. If you don't see
                            the dataset you want, you can log it using the MLRun UI or SDK.
                          </div>
                          <div className="form-row">
                            <FormSelect
                              label="Select a dataset artifact"
                              name="datasets.seperateDataset.datasetArtifact"
                              options={[
                                {
                                  id: 'Dataset1',
                                  label: 'Dataset 1'
                                },
                                {
                                  id: 'Dataset2',
                                  label: 'Dataset 2'
                                },
                                {
                                  id: 'Dataset3',
                                  label: 'Dataset 3'
                                }
                              ]}
                            />
                          </div>
                        </div>
                      ) : activeTab.seperateDataset === 'LOCAL_DATASET_FILE' ? (
                        <div>
                          <div className="form-row">
                            Full local path to a model file or directory (as expected in the
                            Huggingface API)
                          </div>
                          <div className="form-row">
                            <FormInput
                              label="Local path"
                              name="datasets.seperateDataset.localPath"
                              placeholder="Local path..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="form-row">
                            <div>
                              <p>
                                A huggingface dataset name is constructed as{' '}
                                <b>repository_name/dataset_name.</b>
                              </p>
                              Some datasets may be private or protected, so a token can be passed at
                              the Token field.
                            </div>
                          </div>
                          <div className="form-row">
                            <FormInput
                              label="Dataset name"
                              name="datasets.seperateDataset.datasetName"
                              placeholder="Dataset Name..."
                            />
                          </div>
                          <div className="form-row">
                            <FormInput
                              label="Token"
                              name="datasets.seperateDataset.token"
                              placeholder="Token..."
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="form-row">
                        Split a percentage of the training set for validation.
                      </div>
                      <div className="form-row">
                        <FormInput
                          label="Percentage of split"
                          name="datasets.splitPercentage"
                          type="number"
                          min={0}
                        />
                      </div>
                      <div className="form-row">
                        <FormInput label="Seed" name="datasets.seed" type="number" min={0} />
                      </div>
                    </>
                  )}
                </>
              )}
            </DemoStep>

            {/* Step 3: Training Parameters */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Training Parameters</h5>
              </div>
              <p>Commonly used training parameters to adjust the training process.</p>
              <div className="form-row">
                <FormInput
                  label="Batch size"
                  name="trainingParameters.batchSize"
                  type="number"
                  min={0}
                />
              </div>
              <div className="form-row">
                <FormInput label="Ephos" name="trainingParameters.ephos" type="number" min={0} />
              </div>
              <div className="form-row">
                <FormInput label="Steps" name="trainingParameters.steps" type="number" min={0} />
              </div>
              <div className="form-row">
                <FormSelect
                  label="Optimizer"
                  name="trainingParameters.optimizer"
                  options={[
                    {
                      id: 'adamw_hf',
                      label: 'adamw_hf'
                    },
                    {
                      id: 'adamw_torch',
                      label: 'adamw_torch'
                    },
                    {
                      id: 'adamw_torch_fused',
                      label: 'adamw_torch_fused'
                    },
                    {
                      id: 'adamw_apex_fused',
                      label: 'adamw_apex_fused'
                    },
                    {
                      id: 'adafactor',
                      label: 'adafactor'
                    }
                  ]}
                />
              </div>
              <div className="form-row">
                <FormInput
                  label="Learning rate"
                  name="trainingParameters.learningRate"
                  type="number"
                  min={0}
                />
              </div>
              <div className="form-row">
                <FormSelect
                  label="Schedular"
                  name="trainingParameters.schedular"
                  options={[
                    {
                      id: 'linear',
                      label: 'Linear'
                    },
                    {
                      id: 'cosine',
                      label: 'Cosine'
                    },
                    {
                      id: 'cosine_with_restarts',
                      label: 'Cosine_ with restarts'
                    },
                    {
                      id: 'polynomial',
                      label: 'Polynomial'
                    },
                    {
                      id: 'constant',
                      label: 'Constant'
                    },
                    {
                      id: 'constant_with_warmup',
                      label: 'Constant with warmup'
                    }
                  ]}
                />
              </div>
              <div className="form-row">
                <FormSelect
                  label="Data type"
                  name="trainingParameters.dataType"
                  options={[
                    {
                      id: 'float32',
                      label: 'Float32'
                    },
                    {
                      id: 'float16',
                      label: 'Float16'
                    },
                    {
                      id: 'bfloat16',
                      label: 'BFloat16'
                    }
                  ]}
                />
              </div>
              <div className="form-row form-table-title">Validation Parameters</div>
              <p>Commonly used validation parameters to adjust the validation process.</p>
              <p>
                Note: Will only take effect if a training set split or validation set were provided.
              </p>
              <div className="form-row">
                <FormInput
                  label="Batch size"
                  name="trainingParameters.validationParameters.batchSize"
                  type="number"
                  min={0}
                  disabled={!formState.values?.datasets?.isValidateDataset}
                />
              </div>

              <div className="form-row">
                <FormInput
                  label="Steps"
                  name="trainingParameters.validationParameters.steps"
                  type="number"
                  min={0}
                  disabled={!formState.values?.datasets?.isValidateDataset}
                />
              </div>
            </DemoStep>

            {/* Step 4: Logging Parameters */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Logging Parameter</h5>
              </div>
              <p>
                Parameters to use for logging the training and finetuned model. The model is logged
                automatically to MLRun.
              </p>
              <p>Additionally, you can choose to log the training to Tensorboard.</p>

              <div className="form-row form-table-title">MLRun Parameters</div>
              <div className="form-row">
                <FormCheckBox label="Log to MLRun" name="loginParameters.logToMlrun" />
              </div>
              <div className="form-row">
                <FormInput
                  label="Key"
                  name="loginParameters.mlrunParameters.key"
                  placeholder="Key Name..."
                  disabled={!formState.values?.loginParameters?.logToMlrun}
                />
              </div>
              <div className="form-row">
                <FormInput
                  label="Tag"
                  name="loginParameters.mlrunParameters.tag"
                  placeholder="Tag Name..."
                  disabled={!formState.values?.loginParameters?.logToMlrun}
                />
              </div>
              <div className="form-row">
                <FormChipCell
                  chipOptions={{
                    type: 'labels',
                    boldValue: false,
                    background: 'purple',
                    borderColor: 'transparent',
                    density: 'dense',
                    font: 'purple',
                    borderRadius: 'primary'
                  }}
                  formState={formState}
                  initialValues={formState.initialValues}
                  isEditable={formState.values?.loginParameters?.logToMlrun}
                  label="labels"
                  name="loginParameters.mlrunParameters.labels"
                  shortChips
                  visibleChipsMaxLength="all"
                />
              </div>

              <div className="form-row form-table-title">Tensorboard Parameters</div>
              <div className="form-row">
                <FormCheckBox label="Log to Tensorboard" name="loginParameters.logToTensorboard" />
              </div>
              <div className="form-row">
                <FormInput
                  label="Run name"
                  name="loginParameters.tensorboardParameters.runName"
                  placeholder="Run Name..."
                  disabled={!formState.values?.loginParameters?.logToTensorboard}
                />
              </div>
              <div className="form-row">
                <FormInput
                  label="Logging directory"
                  name="loginParameters.tensorboardParameters.loggingDirectory"
                  placeholder="Logging directory"
                  disabled={!formState.values?.loginParameters?.logToTensorboard}
                />
              </div>
            </DemoStep>

            {/* Step 5: Advanced Configuration */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Advanced Configuration</h5>
              </div>
              <p>
                Further parameters and techniques can be given to the fine-tunning job like
                quantization, LORA and more.
              </p>

              <div>
                <div className="form-row form-table-title">Additional Training Arguments</div>
                <p>
                  Training parameters based on{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/v4.37.2/en/main_classes/trainer#transformers.TrainingArguments"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    TrainingArguments
                  </a>
                </p>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-training-parameters"
                    addNewItemLabel="Add training parameters"
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.trainingParameters"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">Pretrained Model Arguments</div>
                <p>
                  Additional Arguments to pass to 'from_pretrained' of an{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/model_doc/auto#transformers.AutoModelForCausalLM"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AutoModelForCausalLM
                  </a>
                </p>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-model-parameters"
                    addNewItemLabel="Add model parameters"
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.modelArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">Pretrained Tokenizer Arguments</div>
                <p>
                  Additional Arguments to pass to 'from_pretrained' of a{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/main_classes/tokenizer#transformers.PreTrainedTokenizer"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tokenizer
                  </a>
                </p>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-tokenizer-parameters"
                    addNewItemLabel="Add tokenizer parameters"
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.tokenizerArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">Data Collator Arguments</div>
                <p>
                  Additional Arguments to pass to the 'DataCollatorForLanguageModeling' of a{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/main_classes/data_collator#transformers.DataCollatorForLanguageModeling"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Initializer
                  </a>
                </p>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-initializer-parameters"
                    addNewItemLabel="Add data collator parameters"
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.collatorArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">LORA Configuration</div>
                <p>
                  LORA configuration parameters based on{' '}
                  <a
                    href="https://huggingface.co/docs/peft/v0.8.2/en/package_reference/lora#peft.LoraConfig"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LoraConfig
                  </a>
                </p>
                <div className="form-row">
                  <FormCheckBox label="Use LORA" name="advancedConfiguration.isLoraChecked" />
                </div>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-lora-parameters"
                    addNewItemLabel="Add Lora parameters"
                    disabled={!formState.values?.advancedConfiguration?.isLoraChecked}
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.loraArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">Quantization Configuration</div>
                <p>
                  Quantization configuration parameters based on{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/main_classes/quantization#transformers.BitsAndBytesConfig"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    BitsAndBytesConfig
                  </a>
                </p>
                <div className="form-row">
                  <FormCheckBox
                    label="Use BitsAndBytes"
                    name="advancedConfiguration.isQuantizationChecked"
                  />
                </div>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-quantization-parameters"
                    addNewItemLabel="Add Quantization parameters"
                    disabled={!formState.values?.advancedConfiguration?.isQuantizationChecked}
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.quantizationArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>

              <div>
                <div className="form-row form-table-title">Deepspeed Configuration</div>
                <p>
                  Deepspeed configuration parameters based on{' '}
                  <a
                    href="https://huggingface.co/docs/transformers/v4.37.2/en/main_classes/deepspeed#zero"
                    className="link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    DeepSpeed Integration
                  </a>
                </p>
                <div className="form-row">
                  <FormCheckBox
                    label="Use Deepspeed"
                    name="advancedConfiguration.isDeepspeedChecked"
                  />
                </div>
                <div className="form-row">
                  <FormKeyValueTable
                    actionButtonId="add-deepspeed-parameters"
                    addNewItemLabel="Add Deepspeed parameters"
                    disabled={!formState.values?.advancedConfiguration?.isDeepspeedChecked}
                    // exitEditModeTriggerItem={stepIsActive}
                    fieldsPath="advancedConfiguration.deepspeedArguments"
                    formState={formState}
                    keyHeader="Key"
                    keyLabel="Key"
                  />
                </div>
              </div>
            </DemoStep>

            {/* Step 6: Resources */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Resources</h5>
              </div>
              <div className="form-row resources-units" data-testid="form-resources-units-tbl">
                <div className="form-col-1">
                  <div className="resources-card">
                    <div className="resources-card__title">Memory</div>
                    <div className="resources-card__fields">
                      <FormInput
                        className="resources-card__fields-input"
                        name="resources.currentRequest.memory"
                        label="Request"
                        type="number"
                        min={1}
                        // validator={(value, allValues) => validateMemory(value, allValues)}
                        required
                        invalidText="Request must be less than or equal to Limit and not be less than 1"
                      />
                      <FormSelect
                        className="resources-card__fields-select"
                        name="resources.currentRequest.memoryUnitId"
                        options={selectUnitOptions.unitMemory}
                      />
                    </div>
                    <div className="resources-card__fields">
                      <FormInput
                        className="resources-card__fields-input"
                        name="resources.currentLimits.memory"
                        label="Limit"
                        type="number"
                        min={1}
                        // validator={(value, allValues) => validateMemory(value, allValues)}
                        required
                        invalidText="Limit must be bigger than or equal to Request and not be less than 1"
                      />
                      <FormSelect
                        className="resources-card__fields-select"
                        name="resources.currentLimits.memoryUnitId"
                        options={selectUnitOptions.unitMemory}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-col-1">
                  <div className="resources-card">
                    <div className="resources-card__title">CPU</div>
                    <div className="resources-card__fields">
                      <FormInput
                        className="resources-card__fields-input"
                        name="resources.currentRequest.cpu"
                        label="Request"
                        type="number"
                        min={1}
                        step={1}
                        required
                        invalidText="Request must be less than or equal to Limit and not be less than 1"
                      />
                      <FormSelect
                        className="resources-card__fields-select"
                        name="resources.currentRequest.cpuUnitId"
                        options={selectUnitOptions.unitCpu}
                      />
                    </div>
                    <div className="resources-card__fields">
                      <FormInput
                        className="resources-card__fields-input"
                        name="resources.currentLimits.cpu"
                        label="Limit"
                        type="number"
                        min={1}
                        step={1}
                        required
                        invalidText="Limit must be bigger than or equal to Request and not be less than 1"
                      />
                      <FormSelect
                        className="resources-card__fields-select"
                        name="resources.currentLimits.cpuUnitId"
                        options={selectUnitOptions.unitCpu}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-col-1">
                  <div className="resources-card">
                    <div className="resources-card__title">GPU</div>
                    <div className="resources-card__fields">
                      <FormInput
                        className="resources-card__fields-input gpu"
                        name="resources.currentLimits.gpuUnitId"
                        label="Limit"
                        type="number"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DemoStep>

            {/* Step 7: Review */}
            <DemoStep>
              <div className="form-row">
                <h5 className="form-step-title">Review</h5>
              </div>
              <div className="form-row">
                <button className="btn btn-primary" onClick={handleCloseWizard}>
                  Start Training Job
                </button>
              </div>
              <pre>
                <code dangerouslySetInnerHTML={{ __html: html }} />
              </pre>
            </DemoStep>
          </Wizard>
        )
      }}
    </Form>
  )
}

export default DemoWizard
