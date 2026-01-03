import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../users/users.service';
import { config } from '../../config/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UserService) {
    super({
      //@eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: {
    sub: number;
    full_name: string;
    email: string;
    role: string;
  }) {
    const user = await this.userService.findById(payload.sub);

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role.name,
      permessions: user.role.permessions.map((ele) => ele.name),
    };
  }
}
