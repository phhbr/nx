import { SomeInterface } from "./some-interface";
import { SomeNewInterface } from "./some-new-interface";

/**
 * Test Interface für die Interfaces README Generator
 * Dieses Interface wird in der generierten Dokumentation angezeigt
 */
export interface ITestButtonConfig {
  /**
   * Der Titel des Buttons
   */
  title: string;
  
  /**
   * Eindeutige Kennung
   */
  id: string;
  
  /**
   * Gibt an, ob der Button aktiv ist
   */
  isActive?: boolean;
  
  /**
   * Liste von zulässigen Aktionen
   */
  allowedActions?: string[];

  /**
   * @deprecated Diese Eigenschaft ist veraltet und wird zukünftig durch "newProperty" ersetzt. Bitte verwenden Sie stattdessen "newProperty".
   */
  testInterface?: SomeInterface; // hier ist dokumentation

  newProperty: SomeNewInterface; // hier ist dokumentation
}
