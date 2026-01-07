import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import {
  changePasswordDTO,
  createUserDTO,
  registerUserDTO,
  UpdateUserByAdminDTO,
  UpdateUserDTO,
} from './dtos/user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from './entities/role.entity';
import { Permession } from './entities/permession.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permession)
    private permessionRepo: Repository<Permession>,
  ) {}

  async registerUser(dto: registerUserDTO) {
    const user = await this.findByEmail(dto.email);
    if (user) throw new ConflictException('This Email already exist');
    const userData = {
      ...dto,
      role_id: 1,
    };
    return this.createInternalUser(userData);
  }

  async createInternalUser(dto: createUserDTO) {
    const hashPassword = await bcrypt.hash(dto.password, 10);
    const savedUser = await this.userRepo.save({
      full_name: dto.full_name,
      email: dto.email,
      password: hashPassword,
      role: { id: dto.role_id },
    });
    const newUser = await this.findById(savedUser.id);
    return newUser;
  }

  async updateUser(user_id: number, userDTO: UpdateUserDTO) {
    await this.findById(user_id);
    const user = await this.userRepo.update(user_id, userDTO);
    return user;
  }
  async updateUserByAdmin(user_id: number, userDTO: UpdateUserByAdminDTO) {
    await this.findById(user_id);
    const user = await this.userRepo.update(user_id, userDTO);
    return user;
  }
  async changePassword(changePassword: changePasswordDTO) {
    const user = await this.findById(changePassword.user_id);
    const isPasswordValid = await bcrypt.compare(
      changePassword.old_password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('The old password is not correct');
    }
    const hashedPass = await bcrypt.hash(changePassword.new_password, 10);
    const updatedUser = this.userRepo.update(
      { id: changePassword.user_id },
      { password: hashedPass },
    );
    return updatedUser;
  }
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: {
        email,
      },
    });
  }
  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
    });
    if (!user) throw new NotFoundException('No user found with this Id');
    return user;
  }
  async getroleById(role_id: number) {
    const role = await this.roleRepo.findOne({
      where: {
        id: role_id,
      },
    });
    if (!role) throw new NotFoundException('Role not found with');
    return role;
  }
}
