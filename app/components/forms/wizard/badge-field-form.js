import Component from '@ember/component';
import { orderBy, union } from 'lodash-es';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import FormMixin from 'open-event-frontend/mixins/form';
import { booleanTextType } from 'open-event-frontend/utils/dictionary/boolean_text_type';
import { fieldFontName } from 'open-event-frontend/utils/dictionary/badge-field';

export default Component.extend(FormMixin, {
  router             : service(),
  autoScrollToErrors : false,
  isExpanded         : true,
  booleanTextType    : orderBy(booleanTextType, 'position'),

  getCustomFields: computed('includeCustomField', function() {
    const validForms = this.includeCustomField.map(item => {
      if (item.isComplex) {
        return { 'isComplex': item.name };
      } else {
        return { 'isFixed': item.name };
      }
    });
    return union(validForms);
  }),

  getQrFields: computed('qrFields', function() {
    return union(this.qrFields, 'name');
  }),

  getWarningFields: computed('data.custom_field', 'selectedTickets', function() {
    const warningFields      = [];
    if (this.data.custom_field !== 'QR') {
      this.selectedTickets.forEach(ticket => {
        const listCFields = this.customForms.filter(form => (ticket.formID === form.formID) && form.isIncluded || form.isFixed).map(form => form.name);
        if (this.data.custom_field && !listCFields.includes(this.data.custom_field)) {
          warningFields.pushObject(
            {
              field  : this.data.custom_field,
              ticket : ticket.name
            }
          );
        }
      });
    }
    return warningFields;
  }),

  getFieldComplex: computed('data.custom_field', function() {
    const { custom_field } = this.data;
    let isComplex = false;
    if (custom_field !== 'QR') {
      this.selectedTickets.forEach(ticket => {
        const listCFields = this.customForms.filter(form => (ticket.formID === form.formID) && form.isIncluded || form.isFixed);
        if (custom_field) {
          listCFields.forEach(field => {
            const { isComplex: fieldIsComplex } = field;
            if (field.name === custom_field) {
              isComplex = fieldIsComplex;
            }
          });
        }
      });
    }
    return isComplex;
  }),

  getWarningQRFields: computed('data.qr_custom_field.@each', 'selectedTickets', function() {
    if (this.data.qr_custom_field) {
      const warningFields      = [];
      this.selectedTickets.forEach(ticket => {
        const listCFields = union(this.customForms.filter(form => (ticket.formID === form.formID) && form.isIncluded || form.isFixed), 'fieldIdentifier');
        this.data.qr_custom_field.forEach(field => {
          const warningField = listCFields.map(item => item.fieldIdentifier).includes(field);
          if (!warningField) {
            warningFields.pushObject(
              {
                field  : this.customForms.find(item => item.fieldIdentifier === field).name,
                ticket : ticket.name
              }
            );
          }
        });
      });
      return warningFields;
    }
  }),

  get fieldFont() {
    return orderBy(fieldFontName, 'name');
  },

  actions: {
    toggleSetting() {
      if (!this.data.is_field_expanded) {
        this.set('data.is_field_expanded', true);
      } else {
        this.set('data.is_field_expanded', false);
      }
    },
    removeForm() {
      if (this.removeBadgeField) {
        this.set('data.is_deleted', true);
        this.removeBadgeField(this.data);
      }
    },
    toggleTextAlignments(item) {
      this.set('data.text_alignment', item);
    },
    onChangeCustomField(code) {
      if (this.onChange) {
        this.onChange(this.data.custom_field, code);
        this.set('data.custom_field', code);
        if (code === 'QR') {
          this.set('data.field_identifier', 'QR');
        } else {
          const cfield = this.includeCustomField.filter(item => item.name === code)[0];
          if (cfield) {
            this.set('data.field_identifier', cfield.fieldIdentifier);
          }
        }
      }
    },
    onChangeTextTransform(value) {
      this.set('data.text_type', value);
    },
    onChangeFontName(value) {
      this.set('data.font_name', value);
    }
  }
});
