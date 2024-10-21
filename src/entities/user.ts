import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post';
import { Comment } from './comment';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { nullable: false })
  firstName: string;

  @Column('varchar', { nullable: true })
  lastName?: string;

  @Index({ unique: true })
  @Column('varchar', { nullable: false })
  username: string;

  @Column('varchar', { nullable: false })
  passwordHash: string;

  @OneToMany(() => Post, (post) => post.createdBy)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.createdBy, { eager: false })
  comments: Comment[];
}
