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
import { By } from 'selenium-webdriver'
import commonTable from '../components/table.component'
import dropdownComponent from '../components/dropdown.component'
import labelComponent from '../components/label.component'
import {
  generateDropdownGroup,
  generateInputGroup,
  generateLabelGroup
} from '../../common-tools/common-tools'
import inputGroup from '../components/input-group.component'
import checkboxComponent from '../components/checkbox.component'
import datepicker from '../components/date-picker.component'
import actionMenu from '../components/action-menu.component'

const tabSelector = {
  root: '.content .content-menu',
  header: {},
  body: {
    root: '.content-menu__tabs',
    row: {
      root: '.content-menu__tab',
      fields: {
        key: ''
      }
    }
  }
}

const actionMenuStructure = {
  root: '.actions-menu__container',
  menuElements: {
    open_button: 'button',
    options: '.actions-menu__body .actions-menu__option'
  }
}

const overallTable = {
  root: '.table__content',
  header: {
    root: '.table-head',
    sorters: {
      name: '.table-head__item:nth-of-type(1) .data-ellipsis',
      type: '.table-head__item:nth-of-type(2) .data-ellipsis',
      duration: '.table-head__item:nth-of-type(3) .data-ellipsis',
      owner: '.table-head__item:nth-of-type(4) .data-ellipsis',
      labels: '.table-head__item:nth-of-type(5) .data-ellipsis',
      parameters: '.table-head__item:nth-of-type(6) .data-ellipsis',
      results: '.table-head__item:nth-of-type(7) .data-ellipsis'
    }
  },
  body: {
    root: '.table-body',
    row: {
      root: '.table-row',
      fields: {
        status: {
          componentType: labelComponent,
          structure: generateLabelGroup(
            '.table-body__cell:nth-of-type(1) .status',
            'i',
            true,
            '.tooltip .tooltip__text span'
          )
        },
        name: '[data-testid="name"] a .link',
        uid: '[data-testid="uid"] a .link',
        project_name: '[data-testid="projectName"] .data-ellipsis',
        datetime:
          '.table-body__cell:nth-of-type(1) a .date-uid-row .link-subtext:nth-of-type(1)',
        duration: '.table-body__cell:nth-of-type(3) .data-ellipsis',
        owner: '.table-body__cell:nth-of-type(4) .data-ellipsis',
        action_menu: {
          componentType: actionMenu,
          structure: actionMenuStructure
        },
        labels: {
          componentType: dropdownComponent,
          structure: generateDropdownGroup(
            '.table-body__cell:nth-of-type(7)',
            '.chip-block span.chips_button',
            '.chip-block-hidden_visible .data-ellipsis.tooltip-wrapper',
            false,
            false
          )
        },
        type: {
          componentType: labelComponent,
          structure: generateLabelGroup(
            '.table-body__cell:nth-of-type(3)',
            '.data-ellipsis',
            true,
            '.tooltip .tooltip__text span'
          )
        }
      }
    }
  }
}

const scheduledTabTable = {
  root: '.table__content',
  header: {
    root: '.table-head',
    sorters: {
      name: '.table-head__item:nth-of-type(1) .data-ellipsis',
      type: '.table-head__item:nth-of-type(2) .data-ellipsis',
      duration: '.table-head__item:nth-of-type(3) .data-ellipsis',
      owner: '.table-head__item:nth-of-type(4) .data-ellipsis',
      labels: '.table-head__item:nth-of-type(5) .data-ellipsis',
      parameters: '.table-head__item:nth-of-type(6) .data-ellipsis',
      results: '.table-head__item:nth-of-type(7) .data-ellipsis'
    }
  },
  body: {
    root: '.table-body',
    row: {
      root: '.table-row',
      fields: {
        name: '.table-cell-name.link',
        uid: '[data-testid="uid"] a .link',
        project_name: '[data-testid="projectName"] .data-ellipsis',
        datetime:
          '.table-body__cell:nth-of-type(1) a .date-uid-row .link-subtext:nth-of-type(1)',
        duration: '.table-body__cell:nth-of-type(3) .data-ellipsis',
        owner: '.table-body__cell:nth-of-type(4) .data-ellipsis',
        action_menu: {
          componentType: actionMenu,
          structure: actionMenuStructure
        },
        labels: {
          componentType: dropdownComponent,
          structure: generateDropdownGroup(
            '.table-body__cell:nth-of-type(7)',
            '.chip-block span.chips_button',
            '.chip-block-hidden_visible .data-ellipsis.tooltip-wrapper',
            false,
            false
          )
        },
        type: {
          componentType: labelComponent,
          structure: generateLabelGroup(
            '.table-body__cell:nth-of-type(3)',
            '.data-ellipsis',
            true,
            '.tooltip .tooltip__text span'
          )
        },
        status: {
          componentType: labelComponent,
          structure: generateLabelGroup(
            '.table-body__cell:nth-of-type(1) .status',
            'i',
            true,
            '.tooltip .tooltip__text span'
          )
        }
      }
    }
  }
}

const commonDatePickerFilter = dropdownComponent(
  generateDropdownGroup(
    '[data-testid="date-picker-container"]',
    '[data-testid="date-picker-input"]',
    '.date-picker__pop-up .select__item',
    '.data-ellipsis .data-ellipsis',
    false
  )
)
const commonCustomRangeFilter = dropdownComponent(
  generateDropdownGroup(
    '[data-testid="date-picker-container"]',
    '[data-testid="date-picker-input"] input',
    '.date-picker__pop-up .select__item',
    '.data-ellipsis .data-ellipsis',
    false
  )
)

const commonSearchByNameFilterInput = inputGroup(
  generateInputGroup(
    '[data-testid="name-form-field-input"]',
    true,
    false
  )
)

// date picker start
const calendarTable = {
  root: '',
  header: {
    root: '.date-picker__weeks',
    sorters: {
      Sunday: '.date-picker__weeks-day:nth-of-type(1)',
      Monday: '.date-picker__weeks-day:nth-of-type(1)',
      Tuesday: '.date-picker__weeks-day:nth-of-type(1)',
      Wednesday: '.date-picker__weeks-day:nth-of-type(1)',
      Thursday: '.date-picker__weeks-day:nth-of-type(1)',
      Friday: '.date-picker__weeks-day:nth-of-type(1)',
      Saturday: '.date-picker__weeks-day:nth-of-type(1)'
    }
  },
  body: {
    offset: 3,
    row: {
      root: '.date-picker__week',
      fields: {
        Sunday: '.date-picker__week-day-wrapper:nth-of-type(1)',
        Monday: '.date-picker__week-day-wrapper:nth-of-type(2)',
        Tuesday: '.date-picker__week-day-wrapper:nth-of-type(3)',
        Wednesday: '.date-picker__week-day-wrapper:nth-of-type(4)',
        Thursday: '.date-picker__week-day-wrapper:nth-of-type(5)',
        Friday: '.date-picker__week-day-wrapper:nth-of-type(6)',
        Saturday: '.date-picker__week-day-wrapper:nth-of-type(7)'
      }
    }
  }
}

const dateTimePickerCalendars = {
  root: '.date-picker__pop-up',
  apply_button: 'button.date-picker__apply-btn',
  error_message: '.error',
  fromDatePicker: {
    root: '.date-picker__calendars .date-picker__calendar:nth-of-type(1)',
    elements: {
      month_prev_btn:
        '.date-picker__header svg.date-picker__header-previous-month',
      month_next_btn: '.date-picker__header svg.date-picker__header-next-month',
      month_label: '.date-picker__header div .date-picker__header-month',
      year_label: '.date-picker__header div .date-picker__header-year',
      time_input: '.date-picker__time input',
      calendar: {
        componentType: commonTable,
        structure: calendarTable
      }
    }
  },
  toDatePicker: {
    root: '.date-picker__calendars .date-picker__calendar:nth-of-type(2)',
    elements: {
      month_prev_btn:
        '.date-picker__header svg.date-picker__header-previous-month',
      month_next_btn: '.date-picker__header svg.date-picker__header-next-month',
      month_label: '.date-picker__header div .date-picker__header-month',
      year_label: '.date-picker__header div .date-picker__header-year',
      time_input: '.date-picker__time input',
      calendar: {
        componentType: commonTable,
        structure: calendarTable
      }
    }
  }
}
// datepicker end

const commonRefreshButton = By.css('[data-testid="refresh"]')
const commonErrorMessage = By.css('[data-testid="no-data"] h3')
const commonActionMenu = actionMenu(actionMenuStructure)

export default {
  crossJobsMonitorTab: {
    Cross_Jobs_Tab_Selector: commonTable(tabSelector),
    Table_FilterBy_Button: By.css('[data-testid="filter-menu-btn-tooltip-wrapper"]'),
    Refresh_Button: commonRefreshButton,
    Error_Message: commonErrorMessage,
    Auto_Refresh_Checkbox: checkboxComponent({
      root: '[data-testid="form-field-checkbox"]',
      elements: {
        checkbox: 'input', 
        name: '',
        icon: ''
      }
    }),
    Auto_Refresh_Checkbox_Element: By.css('[data-testid="form-field-checkbox"] input'),
    Search_By_Name_Filter_Input: commonSearchByNameFilterInput,
    Date_Picker_Filter_Dropdown: commonDatePickerFilter,
    Custom_Range_Filter_Dropdown: commonCustomRangeFilter,
    Date_Time_Picker: datepicker(dateTimePickerCalendars),
    Jobs_Table: commonTable(overallTable),
    Arrow_Back: By.css('a.link-back__icon')
  },
  crossWorkflowsMonitorTab: {
    Cross_Jobs_Tab_Selector: commonTable(tabSelector),
    Table_FilterBy_Button: By.css('[data-testid="filter-menu-btn-tooltip-wrapper"]'),
    Search_By_Name_Filter_Input: commonSearchByNameFilterInput,
    Date_Picker_Filter_Dropdown: commonDatePickerFilter,
    Custom_Range_Filter_Dropdown: commonCustomRangeFilter,
    Date_Time_Picker: datepicker(dateTimePickerCalendars),
    Refresh_Button: commonRefreshButton,
    Error_Message: commonErrorMessage,
    Workflows_Table: commonTable(overallTable),
    Action_Menu: commonActionMenu,
    Toggle_View_Button: By.css('.workflow-container .actions .toggle-view-btn'),
    Terminate_Button: By.css('.workflow-container .btn-danger'),
    Workflow_List_View_Table: commonTable(overallTable)
  },
  crossScheduledMonitorTab: {
    Cross_Jobs_Tab_Selector: commonTable(tabSelector),
    Table_FilterBy_Button: By.css('[data-testid="filter-menu-btn-tooltip-wrapper"]'),
    Search_By_Name_Filter_Input: commonSearchByNameFilterInput,
    Date_Picker_Filter_Dropdown: commonDatePickerFilter,
    Custom_Range_Filter_Dropdown: commonCustomRangeFilter,
    Date_Time_Picker: datepicker(dateTimePickerCalendars),
    Refresh_Button: commonRefreshButton,
    Error_Message: commonErrorMessage,
    Scheduled_Table: commonTable(scheduledTabTable)
  }
}
