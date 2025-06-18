import minimatch from 'minimatch';
import * as ts from 'typescript';
import { importClassesFromDirectories } from '../utils/importClassesFromDirectories';
import { ControllerGenerator } from './controllerGenerator';
import { GenerateMetadataError } from './exceptions';
import { Tsoa } from './tsoa';
import { TypeResolver } from './typeResolver';

export class MetadataGenerator {
  public readonly nodes = new Array<ts.Node>();
  public readonly typeChecker: ts.TypeChecker;
  private readonly program: ts.Program;
  private referenceTypeMap: Tsoa.ReferenceTypeMap = {};
  private circularDependencyResolvers = new Array<(referenceTypes: Tsoa.ReferenceTypeMap) => void>();
  private controllers = new Array<Tsoa.Controller>();

  public IsExportedNode(node: ts.Node) {
    return true;
  }

  constructor(entryFile: string, private readonly compilerOptions?: ts.CompilerOptions, private readonly ignorePaths?: string[], controllers?: string[]) {
    TypeResolver.clearCache();
    this.program = !!controllers ? this.setProgramToDynamicControllersFiles(controllers) : ts.createProgram([entryFile], compilerOptions || {});
    this.typeChecker = this.program.getTypeChecker();
  }

  public Generate(): Tsoa.Metadata {
    this.extractNodeFromProgramSourceFiles();
    this.buildControllers();

    this.circularDependencyResolvers.forEach(c => c(this.referenceTypeMap));

    return {
      controllers: this.controllers,
      referenceTypeMap: this.referenceTypeMap,
    };
  }

  private setProgramToDynamicControllersFiles(controllers) {
    const allGlobFiles = importClassesFromDirectories(controllers);
    if (allGlobFiles.length === 0) {
      throw new GenerateMetadataError(`[${controllers.join(', ')}] globs found 0 controllers.`);
    }

    return ts.createProgram(allGlobFiles, this.compilerOptions || {});
  }

  private extractNodeFromProgramSourceFiles() {
    this.program.getSourceFiles().forEach(sf => {
      if (this.ignorePaths && this.ignorePaths.length) {
        for (const path of this.ignorePaths) {
          if (minimatch(sf.fileName, path)) {
            return;
          }
        }
      }

      ts.forEachChild(sf, node => {
        this.nodes.push(node);
      });
    });
  }

  public TypeChecker() {
    return this.typeChecker;
  }

  public AddReferenceType(referenceType: Tsoa.ReferenceType) {
    if (!referenceType.refName) {
      return;
    }
    this.referenceTypeMap[referenceType.refName] = referenceType;
  }

  public GetReferenceType(refName: string) {
    return this.referenceTypeMap[refName];
  }

  public OnFinish(callback: (referenceTypes: Tsoa.ReferenceTypeMap) => void) {
    this.circularDependencyResolvers.push(callback);
  }

  private buildControllers() {
    this.nodes
      .filter((node): node is ts.ClassDeclaration => ts.isClassDeclaration(node))
      .forEach(classDeclaration => {
        const controller = new ControllerGenerator(classDeclaration, this);
        this.controllers.push(controller.Generate());
      });
  }
}
