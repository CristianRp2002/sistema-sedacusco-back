import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { rol_id, ...userData } = createUserDto;
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const newUser = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        rol: { id: rol_id } as any,
      });
      return await this.userRepository.save(newUser);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear usuario: ' + error.message);
    }
  }

  findAll() {
    return this.userRepository.find({
      relations: ['rol']
    });
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { rol_id, ...userData } = updateUserDto;

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    } else {
      delete userData.password;
    }

    const user = await this.userRepository.preload({
      id,
      ...userData,
      ...(rol_id ? { rol: { id: rol_id } as any } : {}),
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userRepository.remove(user);
  }

  async findOneByUsernameWithPassword(username: string) {
    return await this.userRepository.createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .leftJoinAndSelect('user.rol', 'rol')
      .getOne();
  }
}