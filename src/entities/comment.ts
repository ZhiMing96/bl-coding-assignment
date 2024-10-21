import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post';
import { User } from './user';

@Entity({ name: 'comment' })
export class Comment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { nullable: true })
  text: string;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
  post: Post;

  @Column()
  postId: number;

  @ManyToOne(() => User, (user) => user.comments, { nullable: true })
  createdBy?: User;

  @Column({ nullable: true })
  createdById?: number;

  @Index()
  @CreateDateColumn({
    type: 'timestamptz',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
  })
  updatedAt: Date;
}
