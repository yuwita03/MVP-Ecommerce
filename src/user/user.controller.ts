import { Controller, Get, Post, Body, Patch, Delete, HttpCode, UseGuards, Query, Inject, Param } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { User } from '@prisma/client';
import { UserService } from './user.service';
import { LoginUserRequest, RegisterUserRequest, UpdateUserRequest, UserResponse } from 'src/model/user.model';
import { WebResponse } from 'src/model/web.model';
import { Auth } from '../common/Auth/auth.decorator';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { Role } from 'src/common/roles.enum';
import { Roles } from 'src/common/Guards/roles.decorator';
@Controller('/api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(200)
  async register(@Body() request: RegisterUserRequest) {
    return this.userService.register(request);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() request: LoginUserRequest): Promise<WebResponse<UserResponse>> {
    const user = await this.userService.login(request);
    return {
      data: user,
    };
  }

  @Delete('/logout')
  @HttpCode(200)
  async Logout(@Auth() user: User): Promise<WebResponse<boolean>> {
    await this.userService.logout(user);
    return {
      data: true,
    };
  }

  @Patch()
  @HttpCode(200)
  async update(@Body() request: UpdateUserRequest, @Auth() user: User): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.update(request, user);
    return {
      data: result,
    };
  }

  @Get()
  @HttpCode(200)
  async get(@Auth() user: User): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.get(user);
    return {
      data: result,
    };
  }

  @Get('/admin/users')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUser(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10
  ): Promise<WebResponse<UserResponse[]>> {
    const result = await this.userService.getUser(+page, +size);// + untuk konversi string ke number
    return {
      data: result.data,
      paging: result.paging
    };
  }

  @Patch('/admin/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateByAdmin(
    @Param('id') id: string,
    @Body() request: UpdateUserRequest): Promise<WebResponse<UserResponse>> {
      const result = await this.userService.updateByAdmin(request, id);
      return {
        data: result,
    }
  }
}