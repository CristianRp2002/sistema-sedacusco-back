import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolRepository: Repository<Role>
  ) {}

  create(createRoleDto: CreateRoleDto) {
    const rol = this.rolRepository.create(createRoleDto);
    return this.rolRepository.save(rol);
  }

  findAll() {
    return this.rolRepository.find();
  }

  findOne(id: string) {
    return this.rolRepository.findOneBy({ id });
  }

  update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.rolRepository.update(id, updateRoleDto);
  }

  remove(id: string) {
    return this.rolRepository.delete(id);
  }
}