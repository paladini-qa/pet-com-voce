import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "./domain/entities/employee.entity";
import { Pet } from "./domain/entities/pet.entity";
import { Tutor } from "./domain/entities/tutor.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Tutor, Pet, Employee])],
})
export class IdentityAccessModule {}
