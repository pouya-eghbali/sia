declare module "sializer";

declare type BinaryData = Buffer;

declare type InternallySupportTypes =
  | null
  | undefined
  | string
  | number
  | Record<PropertyKey, unknown>
  | Set<unknown>
  | Map<unknown, unknown>
  | Buffer
  | InternallySupportTypes[];

type PrototypeConstructor<T> = Function & { prototype: T }
type ConstructorFunction<T> = abstract new(...args: any[]) => T

/**
 * @example
 * ```
 * import {ConstructorFactory, Sia} from "."
 * 
 * const arrayBufferFactory: ConstructorFactory<ArrayBuffer, [Buffer]> = {
 *     code: 0, // Unique POsitive Integer
 *     constructor: ArrayBuffer,
 *     args: (item) => [Buffer.from(item)],
 *     build: (buffer) => Uint8Array.from(buffer).buffer,
 * };
 * const s = new Sia({constructors : [arrayBufferFactory]});
 * ```
 */
export declare interface ConstructorFactory<T, R extends InternallySupportTypes[] = InternallySupportTypes[]> {
  /**
   * The custom class you want to support
   */
  constructor: PrototypeConstructor<T> | ConstructorFunction<T>;
  /**
   * A unique positive code point for this class, the smaller the better
   */
  code: number;
  /**
   *  A function to serialize the instances of the class
   */
  args: (item: T) => R;
  /**
   *  A function for restoring instances of the class
   */
  build: (...data: R) => T;
}

declare type SiaOption = {
  /**
   * The maximum size of buffer to use
   * @remarks
   * Use a big size if you're expecting to serialize huge objects
   */
  size?: number | undefined;
  /**
  * An array of extra types and classes, it includes instructions for deserializing the custom types and classes.
  */
  constructors?: Array<ConstructorFactory<any,any>>;
};

declare type DeSiaOption = {
  
  /**
   * The minimum size of string map array to use.
   * @remarks
   * Use a big size if you're expecting to serialize huge objects
   */
  mapSize?: number | undefined;
  
  /**
   * An array of extra types and classes, it includes instructions for deserializing the custom types and classes.
   */
  constructors?: Array<ConstructorFactory<any,any>>;
};

/**
 * Makes an instance of Sia serializer using the given options.
 * @example
 * ```
 * const sia = new Sia({
 * size = 33554432, // Buffer size to use
 * constructors = builtinConstructors // An array of extra classes and types
 * });
 * const buf = sia.serialize(data);
 * ```
 */
export declare class Sia {
  constructor(option?: SiaOption);

  public serialize<T>(data: T): BinaryData;
}

/**
 * Makes an instance of Sia deserializer using the given options.
 * @example
 * ```
 * const desia = new DeSia({
 * mapSize = 256 * 1000, // String map size
 * constructors = builtinConstructors, // An array of extra classes and types
 * const data = desia.deserialize(buf);
 * ```
 */
export declare class DeSia {
  constructor(option?: DeSiaOption);

  public deserialize<T>(buffer: BinaryData): T;
}

/**
 * Serializes the given data using the default parameters.
 * @example
 * ```
 * const buf = sia(data);
 * ```
 */
export declare const sia: <T>(data: T) => BinaryData;

/**
 * Deserializes the given BinaryData using the default parameters.
 * @example
 * ```
 * const data = desia(buf);
 * ```
 */
export declare const desia: <T>(data: BinaryData) => T;

/**
 * Array of default constructors used both by Sia and DeSia.
 */
export declare const constructors: ReadonlyArray<ConstructorFactory<any, any>>;