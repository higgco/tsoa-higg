import * as ts from 'typescript';
import { getInitializerValue } from '../metadataGeneration/initializer-value';

export function getDecorators(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = node.decorators;
  const decoratorsArr: ts.Decorator[] = Array.isArray(decorators) ? decorators : [];
  if (decoratorsArr.length === 0) {
    return [];
  }

  return decoratorsArr
    .map((e: any) => {
      while (e.expression !== undefined) {
        e = e.expression;
      }
      return e as ts.Identifier;
    })
    .filter(isMatching);
}

export function getNodeFirstDecoratorName(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }

  return decorators[0].text;
}

export function getNodeFirstDecoratorValue(node: ts.Node, typeChecker: ts.TypeChecker, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }
  const values = getDecoratorValues(decorators[0], typeChecker);
  return values && values[0];
}

export function getDecoratorValues(decorator: ts.Identifier, typeChecker: ts.TypeChecker) {
  const expression = decorator.parent as ts.CallExpression;
  const expArguments = expression.arguments;
  if (!expArguments || !expArguments.length) {
    return;
  }
  return expArguments.map(a => getInitializerValue(a, typeChecker));
}

export function getSecurites(decorator: ts.Identifier, typeChecker: ts.TypeChecker) {
  const decoratorValues = getDecoratorValues(decorator, typeChecker);
  if (!decoratorValues || !Array.isArray(decoratorValues)) {
    return [undefined, undefined];
  }
  const [first, second] = decoratorValues;
  if (isObject(first)) {
    return first;
  }
  return { [first]: second || [] };
}

export function isDecorator(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return false;
  }
  return true;
}

function isObject(v: any) {
  return typeof v === 'object' && v !== null;
}
