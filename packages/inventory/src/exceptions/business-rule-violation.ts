export class BusinessRuleViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleViolation';
  }
}
