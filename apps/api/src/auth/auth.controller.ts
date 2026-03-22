import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<{ access_token: string }> {
    return this.auth.register(dto.email, dto.password);
  }

  @Post("login")
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.auth.login(dto.email, dto.password);
  }
}
