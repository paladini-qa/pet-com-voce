import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("pets")
export class Pet {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}
