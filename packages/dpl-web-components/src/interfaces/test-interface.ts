import { SomeInterface } from "./some-interface";

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

  testInterface: SomeInterface; // hier ist dokumentation
}
